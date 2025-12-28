"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminListUsers,
  adminBlockUser,
  fetchMe,
  logout,
  refreshTokens,
  updateProfile,
  changePassword,
  type MeResponse,
} from "../lib/api";
import {
  getToken,
  clearToken,
  getRefreshToken,
  setRefreshToken,
  setToken as storeAccessToken,
  clearRefreshToken,
} from "../lib/token";
import { Modal } from "./components/Modal";
import { useRef } from "react";

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshState] = useState<string | null>(null);
  const [usersOpen, setUsersOpen] = useState(false);
  const [users, setUsers] = useState<
    Array<{ id: string; email: string; role: string; createdAt: string; isActive: boolean; isBlocked: boolean; firstName: string; lastName: string; userName: string }>
  >([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profileFirst, setProfileFirst] = useState("");
  const [profileLast, setProfileLast] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
        clearToken();
        clearRefreshToken();
        setTokenState(null);
        setRefreshState(null);
        setMe(null);
        setError(res.error ?? "Not authenticated");
        router.push("/signin");
      }
    };
    load();
  }, [token, refreshToken, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    setMenuOpen(false);
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

  const toggleBlock = async (userId: string, block: boolean) => {
    if (!token) return;
    const res = await adminBlockUser(token, userId, block);
    if (!res.ok) {
      setUsersError(res.error ?? "Failed to update user");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isBlocked: block } : u)));
  };

  const openProfile = () => {
    if (!me) return;
    setProfileEmail(me.user.email);
    setProfileFirst(me.user.firstName ?? "");
    setProfileLast(me.user.lastName ?? "");
    setProfileError(null);
    setProfileOpen(true);
    setMenuOpen(false);
  };

  const openPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError(null);
    setPasswordOpen(true);
    setMenuOpen(false);
  };

  const saveProfile = async () => {
    if (!token || !me) return;
    setProfileSaving(true);
    const res = await updateProfile(token, {
      email: profileEmail,
      firstName: profileFirst,
      lastName: profileLast,
    });
    setProfileSaving(false);
    if (!res.ok) {
      setProfileError(res.error ?? "Failed to update profile");
      return;
    }
    setMe(res.data);
    setProfileOpen(false);
  };

  const savePassword = async () => {
    if (!token) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    const res = await changePassword(token, { currentPassword, newPassword });
    setPasswordSaving(false);
    if (!res.ok) {
      setPasswordError(res.error ?? "Failed to update password");
      return;
    }
    setPasswordOpen(false);
  };

  const goManagePhrases = () => {
    window.location.href = "/phrases";
    setMenuOpen(false);
  };

  return (
    <main className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Repeatutor Frontend Shell</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            Uses backend at {process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8787"}.
          </p>
        </div>
        {me && (
          <div style={{ position: "relative" }} ref={menuRef}>
            <span
              role="button"
              aria-label="User menu"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                userSelect: "none",
                transition: "transform 120ms ease",
              }}
              onMouseDown={(e) => {
                const target = e.currentTarget;
                target.style.transform = "scale(1.08)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ⚙️
            </span>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "110%",
                  background: "#111722",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  minWidth: 160,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  zIndex: 20,
                }}
              >
                <button
                  type="button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "#e7edf3",
                    cursor: "pointer",
                  }}
                  onClick={openProfile}
                >
                  Profile
                </button>
                <button
                  type="button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "#e7edf3",
                    cursor: "pointer",
                  }}
                  onClick={openPassword}
                >
                  Change password
                </button>
                <button
                  type="button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    color: "#e7edf3",
                    cursor: "pointer",
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
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
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="button" type="button" onClick={openUsers} disabled={!token}>
                  Users
                </button>
                <button className="button" type="button" onClick={goManagePhrases} disabled={!token}>
                  Manage phrases
                </button>
              </div>
            )}
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
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "6px 0" }}>
                  <div className="pill">role: {u.role}</div>
                  <div className="pill" style={{ background: u.isActive ? "#4ade80" : "#f87171", color: "#0f1115" }}>
                    {u.isActive ? "Active" : "Inactive"}
                  </div>
                  <div className="pill" style={{ background: u.isBlocked ? "#f97316" : "#22c55e", color: "#0f1115" }}>
                    {u.isBlocked ? "Blocked" : "Allowed"}
                  </div>
                  {me?.user.id !== u.id && (
                    <button
                      className="button"
                      type="button"
                      onClick={() => toggleBlock(u.id, !u.isBlocked)}
                      style={{
                        background: u.isBlocked
                          ? "linear-gradient(120deg,#6ae0ff,#6b8bff)"
                          : "linear-gradient(120deg,#f87171,#fb923c)",
                        padding: "8px 12px",
                      }}
                    >
                      {u.isBlocked ? "Unblock" : "Block"}
                    </button>
                  )}
                </div>
                <div className="muted">created: {new Date(u.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {users.length === 0 && <div className="muted">No users found.</div>}
          </div>
        )}
      </Modal>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Profile">
        {me ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="muted">Username (read-only)</label>
            <input className="input" value={me.user.userName} disabled />

            <label className="muted" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className="input"
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
            />

            <label className="muted" htmlFor="profile-first">
              First name
            </label>
            <input
              id="profile-first"
              className="input"
              maxLength={50}
              value={profileFirst}
              onChange={(e) => setProfileFirst(e.target.value)}
            />

            <label className="muted" htmlFor="profile-last">
              Last name
            </label>
            <input
              id="profile-last"
              className="input"
              maxLength={50}
              value={profileLast}
              onChange={(e) => setProfileLast(e.target.value)}
            />

            {profileError && <div style={{ color: "#ffb4b4" }}>{profileError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="button" type="button" onClick={() => setProfileOpen(false)} disabled={profileSaving}>
                Cancel
              </button>
              <button className="button" type="button" onClick={saveProfile} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="muted">Not signed in</div>
        )}
      </Modal>

      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change password">
        {me ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="muted" htmlFor="current-password">
              Current password
            </label>
            <input
              id="current-password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <label className="muted" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label className="muted" htmlFor="confirm-new-password">
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              className="input"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />

            {passwordError && <div style={{ color: "#ffb4b4" }}>{passwordError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="button" type="button" onClick={() => setPasswordOpen(false)} disabled={passwordSaving}>
                Cancel
              </button>
              <button className="button" type="button" onClick={savePassword} disabled={passwordSaving}>
                {passwordSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="muted">Not signed in</div>
        )}
      </Modal>
      </div>
    </main>
  );
}
