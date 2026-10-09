export type RiskTier = "Green" | "Yellow" | "Orange" | "Red";

export interface User {
  id?: number | string;
  name: string;
  email: string;
  dob?: string;
  cognitive_age?: number;
  created_at?: string;
  is_demo?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user_id?: number;
  name?: string;
  email?: string;
  user?: User;
}

export interface Biomarkers {
  speech_rate?: number;
  pause_frequency?: number;
  pause_duration?: number;
  pitch_mean?: number;
  pitch_std?: number;
  jitter?: number;
  shimmer?: number;
  hnr?: number;
  articulation_rate?: number;
  speaking_duration?: number;
  semantic_coherence?: number;
  lexical_diversity?: number;
  idea_density?: number;
  syntactic_complexity?: number;
  emotional_entropy?: number;
  language_detected?: string;
  [key: string]: any;
}

export interface MoodResult {
  label: "calm" | "stressed" | "sad" | "fatigued" | string;
  confidence: number;
  corrected?: boolean;
}

export interface SessionRecord {
  id?: number | string;
  session_id?: string | number;
  user_id?: number;
  recorded_at?: string;
  created_at?: string;
  risk_score?: number;
  risk_tier: RiskTier;
  confidence?: number;
  biomarkers?: Biomarkers;
  anomaly_flags?: string[] | string;
  transcription?: string;
  mood?: MoodResult;
  method?: string;
  mode?: "voice" | "text";
  session_count?: number;
}

export interface BrainRegion {
  name: string;
  score: number | string;
  color: string;
  status: "ok" | "warn" | "bad";
  desc: string;
}

export interface BiomarkerMetric {
  name: string;
  value: string | number;
  unit: string;
  normalRange: [number, number];
  category: "acoustic" | "linguistic" | "cognitive";
  status: "normal" | "watch" | "alert";
  delta?: string;
  description: string;
}

export interface WeeklyReportData {
  weekLabel: string;
  streak: number;
  sessions_this_week?: number;
  riskTier: RiskTier;
  riskHealth: string;
  metrics: [string, string, string, "up" | "down" | "flat"][];
  insights: string[];
  recommendations: string[];
  patientName: string;
  reportDate: string;
  clinicalSummary: string;
}
