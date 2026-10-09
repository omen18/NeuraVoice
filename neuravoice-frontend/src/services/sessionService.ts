import { SessionRecord, Biomarkers, RiskTier } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const HF_URL = "https://alamfarzann-cognisafe-ml.hf.space";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ── Check if user already recorded today ──────────────────────────────────────
export const checkToday = async (token: string): Promise<any> => {
  const res = await fetch(`${API}/api/sessions/today`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to check today");
  return data;
};

// ── Convert audio blob → File named .wav ─────────────────────────────────────
const blobToWav = (blob: Blob): File =>
  new File([blob], "recording.wav", { type: "audio/wav" });

// ── Stage label map (for the progress bar UI) ─────────────────────────────────
export const STAGE_LABELS: Record<string, string> = {
  uploading:    "Uploading audio...",
  transcribing: "Transcribing speech (Whisper)...",
  acoustic:     "Extracting acoustic features...",
  nlp:          "Analysing language patterns...",
  risk:         "Computing risk tier...",
  done:         "Analysis complete",
};

// Text mode stage labels
export const TEXT_STAGE_LABELS: Record<string, string> = {
  nlp:  "Analysing language patterns...",
  risk: "Computing risk tier...",
  done: "Analysis complete",
};

export const STAGE_ORDER = ["uploading", "transcribing", "acoustic", "nlp", "risk", "done"];
export const TEXT_STAGE_ORDER = ["nlp", "risk", "done"];

// ── Stage timings for voice mode progress simulation ─────────────────────────
const STAGE_TIMINGS = [
  { stage: "transcribing", delay: 20000 },
  { stage: "acoustic",     delay: 15000 },
  { stage: "nlp",          delay: 30000 },
  { stage: "risk",         delay: 5000  },
];

// ── Submit audio DIRECTLY to HF Space ────────────────────────────────────────
export const submitAudioJob = async (
  audioBlob: Blob,
  userId: string | number,
  onStageChange?: (stage: string) => void
): Promise<SessionRecord> => {
  const formData = new FormData();
  const audioFile = blobToWav(audioBlob);
  formData.append("audio", audioFile);
  formData.append("user_id", String(userId));

  let stopped = false;
  const advanceStages = async () => {
    for (const { stage, delay } of STAGE_TIMINGS) {
      await new Promise((r) => setTimeout(r, delay));
      if (stopped) return;
      onStageChange?.(stage);
    }
  };
  advanceStages();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 480000); // 8 min

    const res = await fetch(`${HF_URL}/analyze`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    stopped = true;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HF Space error ${res.status}`);
    }

    onStageChange?.("done");
    const json = await res.json();
    return normalizeAIResult(json);
  } catch (err: any) {
    stopped = true;
    if (err.name === "AbortError")
      throw new Error("Analysis timed out after 8 minutes — please try again.");
    throw err;
  }
};

// ── Submit TEXT directly to HF Space (text mode for mute users) ───────────────
export const submitTextJob = async (
  text: string,
  userId: string | number,
  onStageChange?: (stage: string) => void
): Promise<SessionRecord> => {
  let stopped = false;
  const advanceStages = async () => {
    onStageChange?.("nlp");
    await new Promise((r) => setTimeout(r, 2000));
    if (stopped) return;
    onStageChange?.("risk");
    await new Promise((r) => setTimeout(r, 1500));
    if (stopped) return;
  };
  advanceStages();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 1 min

    const res = await fetch(`${HF_URL}/analyze-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user_id: String(userId) }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    stopped = true;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Analysis error ${res.status}`);
    }

    onStageChange?.("done");
    const json = await res.json();
    return normalizeAIResult(json);
  } catch (err: any) {
    stopped = true;
    if (err.name === "AbortError")
      throw new Error("Text analysis timed out — please try again.");
    throw err;
  }
};

// ── Normalise ML response → consistent internal shape ────────────────────────
export const normalizeAIResult = (raw: any): SessionRecord => {
  const bm = raw.biomarkers || {};
  return {
    risk_tier: (raw.risk_tier as RiskTier) || "Green",
    mode: raw.mode || "voice",
    biomarkers: {
      semantic_coherence: bm.semantic_coherence ?? null,
      lexical_diversity: bm.lexical_diversity ?? null,
      idea_density: bm.idea_density ?? null,
      syntactic_complexity: bm.syntactic_complexity ?? null,
      speech_rate: bm.speech_rate ?? null,
      pause_frequency: bm.pause_frequency ?? null,
      pause_duration: bm.pause_duration_mean ?? null,
      pitch_mean: bm.pitch_mean ?? null,
      pitch_range: bm.pitch_range ?? null,
      jitter: bm.jitter ?? null,
      shimmer: bm.shimmer ?? null,
      hnr: bm.HNR ?? bm.hnr ?? null,
      articulation_rate: bm.articulation_rate ?? null,
      filled_pause_rate: bm.filled_pause_rate ?? null,
    },
    anomaly_flags: raw.anomaly_flags || [],
    session_id: raw.session_id || null,
    created_at: raw.timestamp || new Date().toISOString(),
    confidence: raw.confidence ?? undefined,
    user_id: raw.user_id ? Number(raw.user_id) : undefined,
    mood: raw.mood || undefined,
    method: raw.method || undefined,
    session_count: raw.session_count || undefined,
    [ "processing_time" as any ]: raw.processing_time_seconds ?? null,
    [ "confidence_intervals" as any ]: raw.confidence_intervals || null,
    [ "interpretation" as any ]: raw.interpretation || null,
    [ "xgb" as any ]: raw.xgb || null,
  };
};

// ── Save AI result to Render backend ─────────────────────────────────────────
export const saveSession = async (token: string, aiResult: SessionRecord): Promise<any> => {
  const bm = (aiResult.biomarkers || {}) as Biomarkers;
  const flags = Array.isArray(aiResult.anomaly_flags)
    ? aiResult.anomaly_flags
    : typeof aiResult.anomaly_flags === "string"
    ? [aiResult.anomaly_flags]
    : [];

  const payload = {
    risk_tier: aiResult.risk_tier,
    semantic_coherence: bm.semantic_coherence ?? null,
    lexical_diversity: bm.lexical_diversity ?? null,
    idea_density: bm.idea_density ?? null,
    speech_rate: bm.speech_rate ?? null,
    pause_frequency: bm.pause_frequency ?? null,
    pause_duration: bm.pause_duration ?? null,
    pitch_mean: bm.pitch_mean ?? null,
    pitch_range: (bm as any).pitch_range ?? null,
    jitter: bm.jitter ?? null,
    shimmer: bm.shimmer ?? null,
    hnr: bm.hnr ?? null,
    syntactic_complexity: bm.syntactic_complexity ?? null,
    articulation_rate: bm.articulation_rate ?? null,
    has_anomaly: flags.length > 0,
    anomaly_flags: JSON.stringify(flags),
  };

  const res = await fetch(`${API}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to save session");
  return data;
};
