// Client for all 12 swagger operations. Swagger is the source of truth where it disagrees with the blueprint doc.
import type { ApiSchemas } from "@/types/api";
export const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string, public kind: "security" | "scope" | "server" | "other") { super(message); }
}

async function req<T = any>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try { res = await fetch(BASE + path, init); }
  catch { throw new ApiError(0, "Can't reach the server. Check that the backend is running and CORS allows this origin.", "server"); }
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) {
    const s = res.status, m = body?.message ?? "";
    if (s === 400) throw new ApiError(s, "Request rejected by the security filter or validation. " + m, "security");
    if (s === 403) throw new ApiError(s, "Off-topic: ask about your uploaded course material.", "scope");
    throw new ApiError(s, s >= 500 ? "Server error. Try again." : m || "Request failed.", s >= 500 ? "server" : "other");
  }
  return (body && "data" in body ? body.data : body) as T;
}
const json = (method: string, data: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
const qs = (o: Record<string, string>) => "?" + new URLSearchParams(o).toString();

export type Student = NonNullable<ApiSchemas["StudentResponse"]>;
export type Roadmap = NonNullable<ApiSchemas["RoadmapResponse"]>;
export type Dashboard = NonNullable<ApiSchemas["DashboardAnalyticsResponse"]>;

export const api = {
  // Student (4)
  createStudent: (b: NonNullable<ApiSchemas["StudentRegisterRequest"]>) => req<Student>("/student", json("POST", b)),
  getStudent: (id: string) => req<Student>(`/student/${id}`),
  updateStudent: (id: string, b: Partial<NonNullable<ApiSchemas["StudentRegisterRequest"]>>) => req<Student>(`/student/${id}`, json("PUT", b)),
  listDocuments: (id: string) => req<any[]>(`/student/${id}/documents`),
  // Documents + roadmap (2)
  uploadDocument: (file: File, studentId: string) => { const f = new FormData(); f.append("file", file); f.append("studentId", studentId); return req<any>("/document/upload", { method: "POST", body: f }); },
  getRoadmap: (documentId: string) => req<Roadmap>(`/roadmap/${documentId}`),
  // Teaching (4)
  teachingSession: (studentId: string, documentId: string, query: string) => req<any>("/teaching/session", json("POST", { studentId, documentId, query })),
  getQuiz: (studentId: string, documentId: string) => req<any>("/teaching/quiz" + qs({ studentId, documentId })),
  submitQuiz: (studentId: string, documentId: string, quizId: string | undefined, picks: { questionId: string; selectedOptionIndex: number }[]) =>
    req<any>("/teaching/quiz/submit", json("POST", { studentId, documentId, quizId, submission: picks })),
  // Orchestrator + analytics (2)
  interact: (studentId: string, documentId: string, query: string) => req<any>("/agent/interact", json("POST", { studentId, documentId, query })),
  getDashboard: (studentId: string, documentId: string) => req<Dashboard>("/analytics/dashboard" + qs({ studentId, documentId })),
};

// GET /teaching/stream (SSE). Returns a cancel function.
export function streamTeaching(studentId: string, documentId: string, query: string, h: { onChunk: (c: string) => void; onMeta: (m: any) => void; onDone: () => void; onError: (e: ApiError) => void }) {
  const es = new EventSource(BASE + "/teaching/stream" + qs({ studentId, documentId, query }));
  es.onmessage = (e) => {
    if (e.data === "[DONE]") { es.close(); h.onDone(); return; }
    try { const p = JSON.parse(e.data); if (p.chunk) h.onChunk(p.chunk); if (p.metadata) h.onMeta(p.metadata); }
    catch { h.onChunk(e.data); }
  };
  // EventSource hides the HTTP status, so 400/403 can't be told apart here.
  es.onerror = () => { es.close(); h.onError(new ApiError(0, "The stream was rejected or interrupted. If your question was off-topic or blocked, rephrase it.", "server")); };
  return () => es.close();
}

export const store = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem("studentId")),
  set: (id: string) => localStorage.setItem("studentId", id),
};
