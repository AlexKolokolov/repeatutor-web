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

export interface PhraseDto {
  id: string;
  textEn: string;
  textGe: string | null;
  audioEn: string | null;
  audioGe: string | null;
  level: string | null;
  createdAt: string;
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

const refreshInFlight = new Map<string, Promise<ApiResult<SessionResponse>>>();

export async function refreshTokens(refreshToken: string) {
  if (refreshInFlight.has(refreshToken)) {
    return refreshInFlight.get(refreshToken)!;
  }
  const req = jsonFetch<SessionResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  refreshInFlight.set(refreshToken, req);
  const result = await req;
  refreshInFlight.delete(refreshToken);
  return result;
}

export async function updateProfile(token: string, payload: { email: string; firstName?: string; lastName?: string }) {
  return jsonFetch<MeResponse>("/auth/profile", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function changePassword(token: string, payload: { currentPassword: string; newPassword: string }) {
  return jsonFetch<{ ok: boolean }>("/password", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function adminListPhrases(token: string) {
  return jsonFetch<{ phrases: PhraseDto[] }>("/admin/phrases", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCreatePhrase(token: string, payload: { textEn: string; textGe?: string; level?: string }) {
  return jsonFetch<PhraseDto>("/admin/phrases", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function adminTranslatePhrase(token: string, id: string) {
  return jsonFetch<{ id: string; textGe: string }>(`/admin/phrases/${id}/translate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminTtsPhrase(token: string, id: string, lang: "en" | "de" = "de") {
  return jsonFetch<{ id: string; audioGe?: string; audioEn?: string }>(`/admin/phrases/${id}/tts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lang }),
  });
}

export async function adminUpdatePhrase(
  token: string,
  id: string,
  payload: { textEn?: string; textGe?: string; level?: string },
) {
  return jsonFetch<PhraseDto>(`/admin/phrases/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function adminFetchPhraseAudio(token: string, id: string, lang: "en" | "de" = "de") {
  const res = await fetch(`${API_BASE}/admin/phrases/${id}/audio?lang=${lang}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return { ok: false, error: `Audio not found (${res.status})` } as ApiResult<string>;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { ok: true, data: url } as ApiResult<string>;
}
