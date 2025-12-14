"use client";

import { useState } from "react";
import { signUp } from "../../lib/api";
import { setToken, setRefreshToken } from "../../lib/token";
import { useRouter } from "next/navigation";
import { storePasswordCredential } from "../../lib/credentials";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await signUp(email, password, firstName, lastName, userName);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to sign up");
      return;
    }
    await storePasswordCredential(email, password);
    setToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    router.push("/");
  };

  return (
    <main className="card">
      <h1 style={{ textAlign: "center" }}>Create account</h1>
      <form
        name="signup"
        onSubmit={submit}
        method="post"
        autoComplete="on"
        style={{ display: "flex", flexDirection: "column", gap: 12, margin: "16px auto 0", maxWidth: 360 }}
      >
        <label className="muted" htmlFor="signup-email">
          Email *
        </label>
        <input
          id="signup-email"
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
    <label className="muted" htmlFor="signup-username">
      Username *
    </label>
    <input
      id="signup-username"
      className="input"
      type="text"
      name="userName"
      maxLength={50}
      placeholder="Username"
      value={userName}
      onChange={(e) => setUserName(e.target.value)}
      required
    />
        <label className="muted" htmlFor="signup-password">
          Password *
        </label>
        <input
          id="signup-password"
          className="input"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="password (min 8 chars)"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="muted" htmlFor="signup-password-confirm">
          Confirm password *
        </label>
        <input
          id="signup-password-confirm"
          className="input"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="re-enter password"
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <label className="muted" htmlFor="signup-first-name">
          First name (optional)
        </label>
        <input
          id="signup-first-name"
          className="input"
          type="text"
          name="firstName"
          maxLength={50}
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <label className="muted" htmlFor="signup-last-name">
          Last name (optional)
        </label>
        <input
          id="signup-last-name"
          className="input"
          type="text"
          name="lastName"
          maxLength={50}
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <button
          className="button"
          type="submit"
          disabled={loading}
          style={{ alignSelf: "center", minWidth: 120, marginTop: 8 }}
        >
          {loading ? "Signing up..." : "Sign up"}
        </button>
      </form>
      {error && <div className="muted" style={{ marginTop: 8, color: "#ffb4b4" }}>{error}</div>}
    </main>
  );
}
