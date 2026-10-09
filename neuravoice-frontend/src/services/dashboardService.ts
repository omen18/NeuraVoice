import { User, SessionRecord, WeeklyReportData } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface SessionHistoryItem {
  date: string;
  status: string;
  risk_tier: string;
  session_id: string | number;
}

export interface TrajectoryItem {
  month: string;
  score: number;
  session_count: number;
}

export const getProfile = async (token: string): Promise<User> => {
  const res = await fetch(`${API}/api/users/me`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch profile");
  return data;
};

export const getSessionHistory = async (token: string, months = 1): Promise<SessionHistoryItem[]> => {
  const res = await fetch(`${API}/api/sessions/history?months=${months}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch history");
  return data;
};

export const getLatestSession = async (token: string): Promise<SessionRecord | null> => {
  const res = await fetch(`${API}/api/sessions/latest`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch latest session");
  return data;
};

export const getWeeklyReport = async (token: string): Promise<WeeklyReportData> => {
  const res = await fetch(`${API}/api/reports/weekly`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch weekly report");
  return data;
};

export const getTrajectory = async (token: string, months = 6): Promise<TrajectoryItem[]> => {
  const res = await fetch(`${API}/api/reports/trajectory?months=${months}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch trajectory");
  return data;
};
