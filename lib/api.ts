const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787";

export type ApiResult<T> =
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
  firstName: string | null;
  lastName: string | null;
  userName: string;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface MeResponse {
  user: SessionUser;
}

export async function signUp(email: string, password: string, firstName: string, lastName: string, userName: string) {
  return jsonFetch<SessionResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, firstName, lastName, userName }),
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
  return jsonFetch<{
    users: Array<{
      id: string;
      email: string;
      role: string;
      createdAt: string;
      isActive: boolean;
      firstName: string;
      lastName: string;
      userName: string;
      isBlocked: boolean;
    }>;
  }>("/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminBlockUser(token: string, userId: string, block: boolean) {
  return jsonFetch<{ ok: boolean; blocked: boolean }>(`/admin/users/${userId}/block`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ block }),
  });
}

export async function refreshTokens(refreshToken: string) {
  return jsonFetch<SessionResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function updateProfile(token: string, payload: { email: string; firstName?: string; lastName?: string }) {
  return jsonFetch<MeResponse>("/auth/profile", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}
