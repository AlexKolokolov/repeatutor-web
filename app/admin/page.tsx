"use client";

import { useEffect, useState } from "react";
import { adminListUsers } from "../../lib/api";
import { getToken, setToken } from "../../lib/token";

interface UserRow {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const load = async (token: string) => {
    setLoading(true);
    const res = await adminListUsers(token);
    setLoading(false);
    if (res.ok && res.data) {
      setUsers(res.data.users);
      setError(null);
    } else {
      setError(res.error ?? "Unauthorized");
      setUsers([]);
    }
  };

  useEffect(() => {
    // Read token on client after mount to avoid hydration mismatch.
    const stored = getToken();
    if (stored) {
      setTokenInput(stored);
      load(stored);
    }
  }, []);

  const handleUseToken = () => {
    setToken(tokenInput);
    load(tokenInput);
  };

  return (
    <main className="card">
      <h1>Admin · Users</h1>
      <p className="muted">Requires admin token. Use your login token or ADMIN_TOKEN (`dev-admin-token`).</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <input
          className="input"
          placeholder="Bearer token"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="button" type="button" onClick={handleUseToken}>
          Use token
        </button>
      </div>
      {loading && <div className="muted" style={{ marginTop: 8 }}>Loading...</div>}
      {error && <div style={{ marginTop: 8, color: "#ffb4b4" }}>{error}</div>}
      <div style={{ marginTop: 16 }}>
        {users.map((u) => (
          <div key={u.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontWeight: 600 }}>{u.email}</div>
            <div className="muted">id: {u.id}</div>
            <div className="pill">role: {u.role}</div>
            <div className="muted">created: {new Date(u.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {!loading && !error && users.length === 0 && <div className="muted">No users yet.</div>}
      </div>
    </main>
  );
}
