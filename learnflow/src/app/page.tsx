"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, store, ApiError } from "@/lib/api";

export default function Home() {
  const r = useRouter();
  const [name, setName] = useState(""), [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null), [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [docs, setDocs] = useState<any[]>([]);
  useEffect(() => { const id = store.get(); if (id) api.listDocuments(id).then(d => setDocs(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  async function go() {
    if (!file || !name || !email) return setErr("Add your name, email and a PDF.");
    setBusy(true); setErr("");
    try {
      const s = await api.createStudent({ name, email });
      store.set(s._id!);
      const d = await api.uploadDocument(file, s._id!);
      r.push(`/workspace/${d.documentId}`);
    } catch (e) { setErr((e as ApiError).message); setBusy(false); }
  }
  return (
    <main className="wrap stack" style={{ maxWidth: 640 }}>
      <h1>Turn a PDF into a study plan</h1>
      <p style={{ color: "var(--mute)" }}>Upload course material. You get a roadmap, a tutor that answers from your pages, and quizzes that track what you know.</p>
      <div className="card stack">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} aria-label="Name" />
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email" />
        <label className={"drop" + (over ? " on" : "")} style={{ display: "block" }}
          onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setFile(f); }}>
          {file ? file.name : "Drop a PDF here or click to choose"}
          <input type="file" accept="application/pdf" hidden onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {err && <div className="err" role="alert">{err}</div>}
        <button onClick={go} disabled={busy}>{busy ? "Analyzing PDF and building your roadmap…" : "Build my roadmap"}</button>
      </div>
      {docs.length > 0 && <div className="card"><h3>Your documents</h3>
        {docs.map((d, i) => <p key={i}><a href={`/workspace/${d.documentId ?? d._id}`}>{d.title ?? d.documentId ?? d._id}</a></p>)}</div>}
    </main>
  );
}
