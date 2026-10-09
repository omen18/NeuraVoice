import { AuthResponse } from "../types";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const emailNorm = email.trim().toLowerCase();
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailNorm, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data; // { access_token, user_id, name, email, user }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  dob?: string
): Promise<AuthResponse> => {
  const emailNorm = email.trim().toLowerCase();
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email: emailNorm, password, dob }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
};
