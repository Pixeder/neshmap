"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { api, streamTeaching, store, ApiError, type Roadmap, type Dashboard } from "@/lib/api";

type Tab = "chat" | "roadmap" | "quiz" | "progress";
type Msg = { role: "u" | "a"; text: string; sources?: { title: string; url: string }[] };
const Md = ({ t }: { t: string }) => <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{t}</ReactMarkdown>;
const Err = ({ e }: { e: string }) => e ? <div className="err" role="alert">{e}</div> : null;

export default function Workspace() {
  const { documentId } = useParams<{ documentId: string }>();
  const [sid, setSid] = useState(""); const [tab, setTab] = useState<Tab>("chat");
  const [seed, setSeed] = useState("");
  useEffect(() => setSid(store.get() ?? ""), []);
  if (!sid) return <main className="wrap"><p>No student profile found. <a href="/">Start from the upload page.</a></p></main>;
  const ask = (q: string) => { setSeed(q); setTab("chat"); };
  return (
    <main className="wrap">
      <div className="row" style={{ justifyContent: "space-between" }}><h2>Study workspace</h2><a href="/">New document</a></div>
      <div className="tabs" role="tablist">
        {(["chat", "roadmap", "quiz", "progress"] as Tab[]).map(t =>
          <button key={t} role="tab" className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{{ chat: "Tutor", roadmap: "Roadmap", quiz: "Quiz", progress: "Progress" }[t]}</button>)}
      </div>
      {tab === "chat" && <Chat sid={sid} doc={documentId} seed={seed} clear={() => setSeed("")} goQuiz={() => setTab("quiz")} />}
      {tab === "roadmap" && <RoadmapView sid={sid} doc={documentId} ask={ask} />}
      {tab === "quiz" && <Quiz sid={sid} doc={documentId} />}
      {tab === "progress" && <Progress sid={sid} doc={documentId} ask={ask} />}
    </main>
  );
}

function Chat({ sid, doc, seed, clear, goQuiz }: { sid: string; doc: string; seed: string; clear: () => void; goQuiz: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]); const [q, setQ] = useState(""); const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"stream" | "agent">("stream"); const [err, setErr] = useState("");
  const cancel = useRef<() => void>(); const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);
  useEffect(() => () => cancel.current?.(), []);
  useEffect(() => { if (seed) { send(seed); clear(); } }, [seed]); // eslint-disable-line

  const patchLast = (f: (m: Msg) => Msg) => setMsgs(m => m.map((x, i) => i === m.length - 1 ? f(x) : x));
  async function send(text: string) {
    if (!text.trim() || busy) return;
    setErr(""); setBusy(true); setQ("");
    setMsgs(m => [...m, { role: "u", text }, { role: "a", text: "" }]);
    if (mode === "stream") {
      cancel.current = streamTeaching(sid, doc, text, {
        onChunk: c => patchLast(m => ({ ...m, text: m.text + c })), onMeta: () => {},
        onDone: () => setBusy(false), onError: e => { setErr(e.message); setBusy(false); },
      });
      return;
    }
    try {
      const r = await api.interact(sid, doc, text);
      const res = r.result ?? r;
      patchLast(m => ({ ...m, text: res.answer ?? res.response ?? "```json\n" + JSON.stringify(res, null, 2) + "\n```", sources: res.sources }));
      if (r.executedTool === "assessment_quiz_tool") goQuiz();
    } catch (e) { setErr((e as ApiError).message); setMsgs(m => m.slice(0, -1)); }
    setBusy(false);
  }
  return (
    <div className="stack">
      <div className="stack" style={{ minHeight: 280 }} aria-live="polite">
        {!msgs.length && <p style={{ color: "var(--mute)" }}>Ask about your material, or pick a topic in the Roadmap tab.</p>}
        {msgs.map((m, i) => <div key={i} className={"msg " + m.role}><Md t={m.text || "…"} />
          {m.sources?.map(s => <div key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></div>)}</div>)}
        <div ref={end} />
      </div>
      <Err e={err} />
      <div className="row">
        <select value={mode} onChange={e => setMode(e.target.value as any)} style={{ width: "auto" }} aria-label="Mode">
          <option value="stream">Tutor (live typing)</option><option value="agent">Smart agent (picks a tool)</option></select>
        <input style={{ flex: 1 }} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && send(q)} placeholder="Ask a question" aria-label="Question" />
        <button onClick={() => send(q)} disabled={busy}>Send</button>
      </div>
    </div>
  );
}

function RoadmapView({ sid, doc, ask }: { sid: string; doc: string; ask: (q: string) => void }) {
  const [rm, setRm] = useState<Roadmap>(); const [dash, setDash] = useState<Dashboard>(); const [err, setErr] = useState("");
  useEffect(() => {
    api.getRoadmap(doc).then(setRm).catch(e => setErr(e.message));
    api.getDashboard(sid, doc).then(setDash).catch(() => {}); // adds status badges when available
  }, [sid, doc]);
  const heat = Object.fromEntries((dash?.knowledgeHeatmap ?? []).map(h => [h.topicId, h]));
  return (
    <div className="stack"><Err e={err} />{!rm && !err && <p>Loading roadmap…</p>}
      {rm && <h3>{rm.title}</h3>}
      {rm?.modules?.map(m => (
        <details key={m.moduleId} className="card" open>
          <summary>{m.moduleTitle}</summary>
          <ul style={{ padding: 0 }}>{m.topics?.map(t => { const h: any = heat[t.topicId!]; return (
            <li key={t.topicId} className="t"><div><strong>{t.title}</strong><div style={{ color: "var(--mute)" }}>{t.description}</div>
              <small>{t.estimatedMinutes ? `${t.estimatedMinutes} min` : ""}{t.sourcePageNumbers?.length ? ` · pages ${t.sourcePageNumbers.join(", ")}` : ""}</small></div>
              <div className="row">{h && <span className={"badge " + h.status}>{h.status?.replace("_", " ")} {h.masteryScore}%</span>}
                <button className="ghost" onClick={() => ask(`Teach me: ${t.title}`)}>Study</button></div></li>); })}</ul>
        </details>))}
    </div>
  );
}

function Quiz({ sid, doc }: { sid: string; doc: string }) {
  const [quiz, setQuiz] = useState<any>(); const [pick, setPick] = useState<Record<string, number>>({});
  const [res, setRes] = useState<any>(); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function load() {
    setBusy(true); setErr(""); setRes(undefined); setPick({});
    try { const q = await api.getQuiz(sid, doc); setQuiz(Array.isArray(q) ? { questions: q } : q); } catch (e) { setErr((e as ApiError).message); }
    setBusy(false);
  }
  async function submit() {
    setBusy(true); setErr("");
    try { setRes(await api.submitQuiz(sid, doc, quiz.quizId, Object.entries(pick).map(([questionId, selectedOptionIndex]) => ({ questionId, selectedOptionIndex })))); }
    catch (e) { setErr((e as ApiError).message); }
    setBusy(false);
  }
  const qs: any[] = quiz?.questions ?? [];
  const result = (id: string) => res?.questionResults?.find((r: any) => r.questionId === id);
  return (
    <div className="stack">
      {!quiz && <button onClick={load} disabled={busy}>{busy ? "Writing questions…" : "Quiz me on my current topic"}</button>}
      <Err e={err} />
      {quiz?.topicTitle && <h3>{quiz.topicTitle}</h3>}
      {qs.map((q, n) => { const r = result(q.questionId); return (
        <fieldset key={q.questionId} className="card" disabled={!!res}>
          <legend>{n + 1}. {q.questionText}</legend>
          {q.options?.map((o: string, i: number) => <label key={i} style={{ display: "block", padding: ".2rem 0" }}>
            <input type="radio" style={{ width: "auto", marginRight: 8 }} name={q.questionId} checked={pick[q.questionId] === i} onChange={() => setPick({ ...pick, [q.questionId]: i })} />
            {o}{r && r.correctOptionIndex === i ? " ✓" : ""}</label>)}
          {r && <p className="badge" style={{ color: r.isCorrect ? "var(--ok)" : "var(--bad)" }}>{r.isCorrect ? "Correct." : "Not quite."} {r.explanation}</p>}
        </fieldset>); })}
      {quiz && !res && <button onClick={submit} disabled={busy || Object.keys(pick).length < qs.length}>Submit answers</button>}
      {res && <div className="card"><div className="big">{res.scorePercentage}%</div><p>{res.feedback}</p>
        <p>Mastery {res.updatedMasteryScore}% · <span className={"badge " + res.topicStatus}>{res.topicStatus?.replace("_", " ")}</span></p>
        <button onClick={() => { setQuiz(undefined); }}>Take another quiz</button></div>}
    </div>
  );
}

function Progress({ sid, doc, ask }: { sid: string; doc: string; ask: (q: string) => void }) {
  const [d, setD] = useState<Dashboard>(); const [err, setErr] = useState("");
  useEffect(() => { api.getDashboard(sid, doc).then(setD).catch(e => setErr(e.message)); }, [sid, doc]);
  if (!d) return <div><Err e={err} />{!err && <p>Loading progress…</p>}</div>;
  const heat = d.knowledgeHeatmap ?? [], weak = heat.filter(h => (h.masteryScore ?? 0) < 50);
  const stat = (v: unknown, l: string) => <div className="card"><div className="big">{String(v ?? "–")}</div>{l}</div>;
  return (
    <div className="stack">
      <div className="card"><div className="row" style={{ justifyContent: "space-between" }}><strong>Course completion</strong><span>{d.courseCompletionPercentage ?? 0}%</span></div>
        <div className="bar"><i style={{ width: `${d.courseCompletionPercentage ?? 0}%` }} /></div></div>
      <div className="grid">{stat(d.overallMasteryScore, "Average mastery")}{stat(`${d.completedTopicsCount ?? 0}/${d.totalTopics ?? 0}`, "Topics completed")}{stat(d.needsReviewTopicsCount, "Need review")}</div>
      {heat.length > 2 && <div className="card" style={{ height: 320 }}><ResponsiveContainer><RadarChart data={heat}>
        <PolarGrid /><PolarAngleAxis dataKey="topicTitle" tick={{ fontSize: 11, fill: "currentColor" }} /><PolarRadiusAxis domain={[0, 100]} />
        <Radar dataKey="masteryScore" stroke="#1f4e9c" fill="#1f4e9c" fillOpacity={0.35} /></RadarChart></ResponsiveContainer></div>}
      <div className="card"><h3>Review next</h3>{!weak.length && <p>No weak topics yet. Take a quiz to find gaps.</p>}
        {weak.map(w => <li key={w.topicId} className="t"><span>{w.topicTitle} · {w.masteryScore}%</span>
          <button onClick={() => ask(`Help me review: ${w.topicTitle}`)}>Start review</button></li>)}</div>
      {!!d.weaknessRadar?.length && <div className="card"><h3>Recurring mistakes</h3>{d.weaknessRadar.map((w, i) => <p key={i}>{w.weakness} ({w.occurrences}×)</p>)}</div>}
    </div>
  );
}
