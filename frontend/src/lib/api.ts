import type { RouteSegment, AnomalyScore, GeminiAlert } from "@/lib/mockData";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ─── Disruption Prediction ────────────────────────────────────────────────────

export async function predictBatch(segments: RouteSegment[]): Promise<AnomalyScore[]> {
  const res = await fetch(`${BASE_URL}/disruptions/predict/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: segments.map((s) => ({ segment: s })),
    }),
  });
  if (!res.ok) throw new Error(`predictBatch failed: ${res.status}`);
  const data = await res.json();
  return data.predictions;
}

export async function predictSingle(segment: RouteSegment): Promise<AnomalyScore> {
  const res = await fetch(`${BASE_URL}/disruptions/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segment }),
  });
  if (!res.ok) throw new Error(`predictSingle failed: ${res.status}`);
  return res.json();
}

// ─── Supabase Initial Fetch (fallback before realtime kicks in) ───────────────

// The realtime hook expects { data: T[], live: boolean }
export async function fetchInitialScores(): Promise<{ data: AnomalyScore[]; live: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/disruptions/scores`);
    if (!res.ok) throw new Error(`fetchInitialScores failed: ${res.status}`);
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], live: true };
  } catch {
    return { data: [], live: false }; // hook falls back to MOCK_ANOMALY_SCORES
  }
}

export async function fetchInitialAlerts(): Promise<{ data: GeminiAlert[]; live: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/disruptions/alerts`);
    if (!res.ok) throw new Error(`fetchInitialAlerts failed: ${res.status}`);
    const data = await res.json();
    return { data: Array.isArray(data) ? data : [], live: true };
  } catch {
    return { data: [], live: false }; // hook falls back to MOCK_ALERTS
  }
}

// ─── Gemini Explainability ────────────────────────────────────────────────────

export async function explainPrediction(payload: {
  ml_score: number;
  features: string[];
  weather_data: string;
  supplier_data: string;
}): Promise<{ human_impact: string; actionable_advice: string }> {
  const res = await fetch(`${BASE_URL}/gemini/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`explainPrediction failed: ${res.status}`);
  return res.json();
}

// ─── Fairness Audit ───────────────────────────────────────────────────────────

export async function fetchFairnessAudit() {
  const res = await fetch(`${BASE_URL}/fairness/audit`);
  if (!res.ok) throw new Error(`fetchFairnessAudit failed: ${res.status}`);
  return res.json();
}