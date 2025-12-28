import { refreshTokens, type ApiResult } from "./api";
import { clearRefreshToken, clearToken, getRefreshToken, getToken, setRefreshToken, setToken } from "./token";

export type AuthResult<T> = ApiResult<T> & { authFailed?: boolean; token?: string };

export async function withAuth<T>(action: (token: string) => Promise<ApiResult<T>>): Promise<AuthResult<T>> {
  const accessToken = getToken();
  if (!accessToken) {
    return { ok: false, error: "Not authenticated" };
  }

  const first = await action(accessToken);
  if (first.ok) {
    return { ...first, token: accessToken };
  }

  const refreshToken = getRefreshToken();
  if (refreshToken) {
    const refreshed = await refreshTokens(refreshToken);
    if (refreshed.ok) {
      setToken(refreshed.data.accessToken);
      setRefreshToken(refreshed.data.refreshToken);
      const retry = await action(refreshed.data.accessToken);
      if (retry.ok) {
        return { ...retry, token: refreshed.data.accessToken };
      }
    }
  }

  const storedAccess = getToken();
  const storedRefresh = getRefreshToken();
  if (
    storedAccess &&
    storedRefresh &&
    (storedAccess !== accessToken || storedRefresh !== refreshToken)
  ) {
    const retry = await action(storedAccess);
    if (retry.ok) {
      return { ...retry, token: storedAccess };
    }
  }

  clearToken();
  clearRefreshToken();
  return { ok: false, error: first.error ?? "Not authenticated", authFailed: true };
}
