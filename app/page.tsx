"use client";

import { useEffect, useState } from "react";
import { adminListUsers, fetchMe, logout, refreshTokens, type MeResponse } from "../lib/api";
import {
  getToken,
  clearToken,
  getRefreshToken,
  setRefreshToken,
  setToken as storeAccessToken,
  clearRefreshToken,
} from "../lib/token";
import { Modal } from "./components/Modal";

export default function HomePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshState] = useState<string | null>(null);
  const [usersOpen, setUsersOpen] = useState(false);
  const [users, setUsers] = useState<
    Array<{ id: string; email: string; role: string; createdAt: string; isActive: boolean }>
  >([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    // Read token on client after mount to avoid SSR/client mismatch.
    const stored = getToken();
    const storedRefresh = getRefreshToken();
    setTokenState(stored);
    setRefreshState(storedRefresh);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const res = await fetchMe(token);
      if (res.ok) {
        setMe(res.data);
        setError(null);
      } else {
        // Try refresh once if we have a refresh token
        const rt = refreshToken ?? getRefreshToken();
        if (rt) {
          const r = await refreshTokens(rt);
          if (r.ok) {
            storeAccessToken(r.data.accessToken);
            setRefreshToken(r.data.refreshToken);
            setTokenState(r.data.accessToken);
            setRefreshState(r.data.refreshToken);
            const retry = await fetchMe(r.data.accessToken);
            if (retry.ok) {
              setMe(retry.data);
              setError(null);
              return;
            }
          }
        }
        setMe(null);
        setError(res.error ?? "Not authenticated");
      }
    };
    load();
  }, [token, refreshToken]);

  const handleLogout = async () => {
    if (!token) return;
    await logout(token);
    clearToken();
    clearRefreshToken();
    setMe(null);
    setTokenState(null);
    setRefreshState(null);
  };

  const openUsers = async () => {
    if (!token) return;
    setUsersOpen(true);
    setUsersLoading(true);
    const res = await adminListUsers(token);
    setUsersLoading(false);
    if (res.ok) {
      setUsers(res.data.users);
      setUsersError(null);
      return;
    }
    // try refresh once
    const rt = refreshToken ?? getRefreshToken();
    if (rt) {
      const r = await refreshTokens(rt);
      if (r.ok) {
        storeAccessToken(r.data.accessToken);
        setRefreshToken(r.data.refreshToken);
        setTokenState(r.data.accessToken);
        setRefreshState(r.data.refreshToken);
        const retry = await adminListUsers(r.data.accessToken);
        if (retry.ok) {
          setUsers(retry.data.users);
          setUsersError(null);
          return;
        }
      }
    }
    setUsers([]);
    setUsersError(res.error ?? "Failed to load users");
  };

  return (
    <main className="card">
      <h1>Repeatutor Frontend Shell</h1>
      <p className="muted">Uses backend at {process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8787"}.</p>
      <div style={{ marginTop: 28 }}>
        <h3>Session</h3>
        {me ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {[me.user.firstName, me.user.lastName].filter(Boolean).join(" ") || me.user.userName}
            </div>
            <div className="muted">{me.user.email}</div>
            <div className="pill">role: {me.user.role}</div>
            <div className="pill">username: {me.user.userName}</div>
            <div className="muted" style={{ marginTop: 8, wordBreak: "break-all" }}>
              token: {token}
            </div>
            {me.user.role === "ADMIN" && (
              <button
                className="button"
                style={{ marginTop: 12, marginRight: 8 }}
                type="button"
                onClick={openUsers}
                disabled={!token}
              >
                Users
              </button>
            )}
            <button
              className="button"
              style={{ marginTop: 12 }}
              onClick={handleLogout}
              type="button"
              disabled={!token}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="muted">{error ?? "Not signed in"}</div>
        )}
      <Modal open={usersOpen} onClose={() => setUsersOpen(false)} title="Users">
        {usersLoading && <div className="muted">Loading...</div>}
        {usersError && <div style={{ color: "#ffb4b4" }}>{usersError}</div>}
        {!usersLoading && !usersError && (
          <div>
            {users.map((u) => (
              <div key={u.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontWeight: 600 }}>
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName} <span className="muted">(@{u.userName})</span>
                </div>
                <div className="muted">{u.email}</div>
                <div className="muted">id: {u.id}</div>
                <div className="pill">role: {u.role}</div>
                <div className="pill" style={{ background: u.isActive ? "#4ade80" : "#f87171", color: "#0f1115" }}>
                  {u.isActive ? "Active" : "Inactive"}
                </div>
                <div className="muted">created: {new Date(u.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {users.length === 0 && <div className="muted">No users found.</div>}
          </div>
        )}
      </Modal>
      </div>
    </main>
  );
}
