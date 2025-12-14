"use client";

import { useState } from "react";
import { signIn } from "../../lib/api";
import { setToken, setRefreshToken } from "../../lib/token";
import { useRouter } from "next/navigation";
import { storePasswordCredential } from "../../lib/credentials";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to sign in");
      return;
    }
    await storePasswordCredential(email, password);
    setToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    router.push("/");
  };

  return (
    <main className="card">
      <h1 style={{ textAlign: "center" }}>Sign in</h1>
      <form
        name="login"
        onSubmit={submit}
        method="post"
        autoComplete="on"
        style={{ display: "flex", flexDirection: "column", gap: 12, margin: "16px auto 0", maxWidth: 360 }}
      >
        <label className="muted" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="input"
          type="email"
          name="username"
          autoComplete="username"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="muted" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="button"
          type="submit"
          disabled={loading}
          style={{ alignSelf: "center", minWidth: 120, marginTop: 8 }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error && <div className="muted" style={{ marginTop: 8, color: "#ffb4b4" }}>{error}</div>}
    </main>
  );
}
