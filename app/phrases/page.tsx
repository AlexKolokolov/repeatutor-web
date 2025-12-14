"use client";

import { useEffect, useState } from "react";
import {
  adminListPhrases,
  adminCreatePhrase,
  adminTranslatePhrase,
  adminTtsPhrase,
  adminFetchPhraseAudio,
  adminUpdatePhrase,
  type PhraseDto,
} from "../../lib/api";
import { getToken, getRefreshToken, setRefreshToken, setToken as storeAccessToken, clearToken, clearRefreshToken } from "../../lib/token";
import { fetchMe, refreshTokens, logout } from "../../lib/api";

export default function PhrasesPage() {
  const [phrases, setPhrases] = useState<PhraseDto[]>([]);
  const [newText, setNewText] = useState("");
  const [newTextGe, setNewTextGe] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const token = getToken();
  const refreshToken = getRefreshToken();

  const ensureAuth = async () => {
    if (!token) return null;
    const me = await fetchMe(token);
    if (me.ok) return token;
    if (refreshToken) {
      const r = await refreshTokens(refreshToken);
      if (r.ok) {
        storeAccessToken(r.data.accessToken);
        setRefreshToken(r.data.refreshToken);
        return r.data.accessToken;
      }
    }
    await logout(token);
    clearToken();
    clearRefreshToken();
    return null;
  };

  const load = async () => {
    const t = await ensureAuth();
    if (!t) {
      setError("Not authenticated");
      return;
    }
    const res = await adminListPhrases(t);
    if (res.ok) {
      setPhrases(res.data.phrases);
      setError(null);
    } else {
      setError(res.error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhrase = async () => {
    const t = await ensureAuth();
    if (!t || !newText.trim()) return;
    setLoading(true);
    const res = await adminCreatePhrase(t, { textEn: newText.trim(), level: newLevel || undefined, textGe: newTextGe || undefined });
    setLoading(false);
    if (res.ok) {
      setPhrases([res.data, ...phrases]);
      setNewText("");
      setNewTextGe("");
      setNewLevel("");
      setError(null);
    } else {
      setError(res.error);
    }
  };

  const translate = async (id: string) => {
    const t = await ensureAuth();
    if (!t) return;
    const res = await adminTranslatePhrase(t, id);
    if (res.ok) {
      setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, textGe: res.data.textGe } : p)));
    } else {
      setError(res.error);
    }
  };

  const save = async (phrase: PhraseDto) => {
    const t = await ensureAuth();
    if (!t) return;
    setSavingId(phrase.id);
    const res = await adminUpdatePhrase(t, phrase.id, {
      textEn: phrase.textEn,
      textGe: phrase.textGe ?? undefined,
      level: phrase.level ?? undefined,
    });
    setSavingId(null);
    if (res.ok) {
      setPhrases((prev) => prev.map((p) => (p.id === phrase.id ? res.data : p)));
      setError(null);
    } else {
      setError(res.error);
    }
  };

  const tts = async (id: string, lang: "en" | "de" = "de") => {
    const t = await ensureAuth();
    if (!t) return;
    const res = await adminTtsPhrase(t, id, lang);
    if (res.ok) {
      setPhrases((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                audioGe: res.data.audioGe ?? p.audioGe,
                audioEn: res.data.audioEn ?? p.audioEn,
              }
            : p,
        ),
      );
    } else {
      setError(res.error);
    }
  };

  const play = async (id: string, lang: "en" | "de" = "de") => {
    const t = await ensureAuth();
    if (!t) return;
    const res = await adminFetchPhraseAudio(t, id, lang);
    if (res.ok && res.data) {
      const key = `${id}-${lang}`;
      setAudioUrls((prev) => ({ ...prev, [key]: res.data }));
      const audio = new Audio(res.data);
      audio.play();
    } else {
      setError(res.error ?? "Failed to load audio");
    }
  };

  return (
    <main className="card" style={{ maxWidth: "100%" }}>
      <h1 style={{ textAlign: "center" }}>Manage phrases</h1>
      {error && <div style={{ color: "#ffb4b4", marginBottom: 12 }}>{error}</div>}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: "#e7edf3", minWidth: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: "8px 4px" }}>Level</th>
              <th style={{ padding: "8px 4px" }}>English</th>
              <th style={{ padding: "8px 4px" }}>German</th>
              <th style={{ padding: "8px 4px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {phrases.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <td style={{ padding: "8px 4px" }}>
                  <select
                    className="input"
                    style={{ maxWidth: 120 }}
                    value={p.level ?? ""}
                    onChange={(e) =>
                      setPhrases((prev) =>
                        prev.map((row) => (row.id === p.id ? { ...row, level: e.target.value || null } : row)),
                      )
                    }
                  >
                    <option value="">Level</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </td>
                <td style={{ padding: "8px 4px", display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={p.textEn}
                    onChange={(e) =>
                      setPhrases((prev) =>
                        prev.map((row) => (row.id === p.id ? { ...row, textEn: e.target.value } : row)),
                      )
                    }
                  />
                  <button
                    className="button"
                    type="button"
                    onClick={() => tts(p.id, "en")}
                    disabled={!p.textEn}
                    style={!p.textEn ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  >
                    TTS
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => play(p.id, "en")}
                    disabled={!p.audioEn}
                    style={!p.audioEn ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  >
                    Play
                  </button>
                  <span style={{ display: "inline-block", width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
                </td>
                <td style={{ padding: "8px 4px" }}>
                  <input
                    className="input"
                    value={p.textGe ?? ""}
                    onChange={(e) =>
                      setPhrases((prev) =>
                        prev.map((row) => (row.id === p.id ? { ...row, textGe: e.target.value } : row)),
                      )
                    }
                  />
                </td>
                <td style={{ padding: "8px 4px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="button" type="button" onClick={() => translate(p.id)}>
                    Translate
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => tts(p.id, "de")}
                    disabled={!p.textGe}
                    style={!p.textGe ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  >
                    TTS
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => play(p.id, "de")}
                    disabled={!p.audioGe}
                    style={!p.audioGe ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  >
                    Play
                  </button>
                  <span style={{ flexGrow: 1 }} />
                  <span style={{ display: "inline-block", width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
                  <button className="button" type="button" onClick={() => save(p)} disabled={savingId === p.id}>
                    {savingId === p.id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <select className="input" style={{ maxWidth: 120 }} value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
          <option value="">Level</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="B1">B1</option>
          <option value="B2">B2</option>
          <option value="C1">C1</option>
          <option value="C2">C2</option>
        </select>
        <input
          className="input"
          placeholder="English phrase"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <input
          className="input"
          placeholder="German phrase (optional)"
          value={newTextGe}
          onChange={(e) => setNewTextGe(e.target.value)}
        />
        <button className="button" type="button" onClick={addPhrase} disabled={loading || !newText.trim()}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </main>
  );
}
