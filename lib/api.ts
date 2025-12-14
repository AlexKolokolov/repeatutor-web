const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body?.error?.message ?? `Request failed (${res.status})` };
    }
    return { ok: true, data: body as T };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Network error" };
  }
}

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
}

export interface MeResponse {
  user: SessionUser;
}

export async function signUp(email: string, password: string) {
  return jsonFetch<SessionResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signIn(email: string, password: string) {
  return jsonFetch<SessionResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(token: string) {
  return jsonFetch<MeResponse>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logout(token: string) {
  return jsonFetch<{ ok: boolean }>("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminListUsers(token: string) {
  return jsonFetch<{ users: Array<{ id: string; email: string; role: string; createdAt: string }> }>("/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
