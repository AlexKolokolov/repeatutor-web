"use client";

import { useEffect, useState } from "react";
import { type PhraseDto } from "../../lib/api";
import { useAuthedApi } from "../../lib/authedApi";

export default function PhrasesPage() {
  const authedApi = useAuthedApi();
  const [phrases, setPhrases] = useState<PhraseDto[]>([]);
  const [newText, setNewText] = useState("");
  const [newTextGe, setNewTextGe] = useState("");
  const [newLevel, setNewLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, { textEn: string; textGe: string | null; level: string | null }>>({});

  const load = async () => {
    const res = await authedApi.adminListPhrases();
    if (res.ok) {
      setPhrases(res.data.phrases);
      const saved: Record<string, { textEn: string; textGe: string | null; level: string | null }> = {};
      res.data.phrases.forEach((p) => {
        saved[p.id] = { textEn: p.textEn, textGe: p.textGe, level: p.level };
      });
      setLastSaved(saved);
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
    if (!newText.trim()) return;
    setLoading(true);
    const res = await authedApi.adminCreatePhrase({ textEn: newText.trim(), level: newLevel || undefined, textGe: newTextGe || undefined });
    setLoading(false);
    if (res.ok) {
      setPhrases([res.data, ...phrases]);
      setLastSaved((prev) => ({
        ...prev,
        [res.data.id]: { textEn: res.data.textEn, textGe: res.data.textGe, level: res.data.level },
      }));
      setNewText("");
      setNewTextGe("");
      setNewLevel("");
      setError(null);
    } else {
      setError(res.error);
    }
  };

  const translate = async (id: string) => {
    const current = phrases.find((p) => p.id === id);
    const res = await authedApi.adminTranslatePhrase(id);
    if (res.ok) {
      setPhrases((prev) => prev.map((p) => (p.id === id ? { ...p, textGe: res.data.textGe } : p)));
      setLastSaved((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), textGe: res.data.textGe, textEn: prev[id]?.textEn ?? current?.textEn ?? "", level: prev[id]?.level ?? current?.level ?? null },
      }));
    } else {
      setError(res.error);
    }
  };

  const saveById = async (id: string) => {
    const current = phrases.find((p) => p.id === id);
    if (!current) return;
    const prev = lastSaved[id];
    if (prev && prev.textEn === current.textEn && prev.textGe === current.textGe && prev.level === current.level) {
      return;
    }
    setSavingId(id);
    const res = await authedApi.adminUpdatePhrase(id, {
      textEn: current.textEn,
      textGe: current.textGe ?? undefined,
      level: current.level ?? undefined,
    });
    setSavingId(null);
    if (res.ok) {
      setPhrases((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      setLastSaved((prev) => ({
        ...prev,
        [id]: { textEn: res.data.textEn, textGe: res.data.textGe, level: res.data.level },
      }));
      setError(null);
    } else {
      setError(res.error);
    }
  };

  const tts = async (id: string, lang: "en" | "de" = "de") => {
    const current = phrases.find((p) => p.id === id);
    const res = await authedApi.adminTtsPhrase(id, lang);
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
      setLastSaved((prev) => ({
        ...prev,
        [id]: {
          textEn: prev[id]?.textEn ?? current?.textEn ?? "",
          textGe: prev[id]?.textGe ?? current?.textGe ?? null,
          level: prev[id]?.level ?? current?.level ?? null,
        },
      }));
    } else {
      setError(res.error);
    }
  };

  const play = async (id: string, lang: "en" | "de" = "de") => {
    const res = await authedApi.adminFetchPhraseAudio(id, lang);
    if (res.ok && res.data) {
      const key = `${id}-${lang}`;
      setAudioUrls((prev) => ({ ...prev, [key]: res.data }));
      const audio = new Audio(res.data);
      void audio.play();
    } else if (!res.ok) {
      setError(res.error ?? "Failed to load audio");
    }
  };

  return (
    <main className="card" style={{ maxWidth: "100%" }}>
      <h1 style={{ textAlign: "center" }}>Manage phrases</h1>
      {error && <div style={{ color: "#ffb4b4", marginBottom: 12 }}>{error}</div>}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
          borderSpacing: "0 2px",
          color: "#e7edf3",
          minWidth: "100%",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: 80 }} />
          <col style={{ width: "45%" }} />
          <col style={{ width: "35%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: "4px 6px" }}>Level</th>
              <th style={{ padding: "4px 6px" }}>English</th>
              <th style={{ padding: "4px 6px" }}>German</th>
              <th style={{ padding: "4px 6px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {phrases.map((p) => (
              <tr key={p.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                <td style={{ padding: "4px 6px" }}>
                  <select
                    className="input"
                    style={{ width: 60, padding: "4px 6px" }}
                    value={p.level ?? ""}
                    onChange={(e) =>
                      setPhrases((prev) =>
                        prev.map((row) => (row.id === p.id ? { ...row, level: e.target.value || null } : row)),
                      )
                    }
                    onBlur={() => saveById(p.id)}
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
                <td style={{ padding: "4px 6px", display: "flex", gap: 4, alignItems: "center" }}>
                  <input
                    className="input"
                    style={{ flex: 1, padding: "4px 8px" }}
                    value={p.textEn}
                    onChange={(e) =>
                      setPhrases((prev) =>
                        prev.map((row) => (row.id === p.id ? { ...row, textEn: e.target.value } : row)),
                      )
                    }
                    onBlur={() => saveById(p.id)}
                  />
                  <button
                    className="button"
                    type="button"
                    onClick={() => tts(p.id, "en")}
                    disabled={!p.textEn}
                    style={{
                      padding: "4px 8px",
                      ...(p.textEn ? {} : { opacity: 0.5, cursor: "not-allowed" }),
                    }}
                  >
                    TTS
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => play(p.id, "en")}
                    disabled={!p.audioEn}
                    style={{
                      padding: "4px 8px",
                      ...(p.audioEn ? {} : { opacity: 0.5, cursor: "not-allowed" }),
                    }}
                  >
                    Play
                  </button>
                  <span style={{ display: "inline-block", width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
                </td>
                <td style={{ padding: "4px 6px" }}>
                  <input
                    className="input"
                    style={{ padding: "4px 8px" }}
                    value={p.textGe ?? ""}
                    onChange={(e) =>
                      setPhrases((prev) =>
                        prev.map((row) => (row.id === p.id ? { ...row, textGe: e.target.value } : row)),
                      )
                    }
                    onBlur={() => saveById(p.id)}
                  />
                </td>
                <td style={{ padding: "4px 6px", display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <button className="button" style={{ padding: "4px 8px" }} type="button" onClick={() => translate(p.id)}>
                    Translate
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => tts(p.id, "de")}
                    disabled={!p.textGe}
                    style={{
                      padding: "4px 8px",
                      ...(p.textGe ? {} : { opacity: 0.5, cursor: "not-allowed" }),
                    }}
                  >
                    TTS
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => play(p.id, "de")}
                    disabled={!p.audioGe}
                    style={{
                      padding: "4px 8px",
                      ...(p.audioGe ? {} : { opacity: 0.5, cursor: "not-allowed" }),
                    }}
                  >
                    Play
                  </button>
                  <span style={{ flexGrow: 1 }} />
                  {savingId === p.id && <span style={{ fontSize: 12, opacity: 0.7 }}>Saving…</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: "0 2px",
          minWidth: "100%",
          tableLayout: "fixed",
          marginTop: 4,
        }}
      >
        <colgroup>
          <col style={{ width: 80 }} />
          <col style={{ width: "45%" }} />
          <col style={{ width: "50%" }} />
          <col style={{ width: "5%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ padding: "4px 6px" }}>
              <select className="input" style={{ width: 60, padding: "4px 6px" }} value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </td>
            <td style={{ padding: "4px 6px", display: "flex", gap: 4 }}>
              <input
                className="input"
                style={{ padding: "4px 8px", width: "100%" }}
                placeholder="English phrase"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <span style={{ display: "inline-block", width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
            </td>
            <td style={{ padding: "4px 6px" }}>
              <input
                className="input"
                style={{ padding: "4px 8px", width: "100%" }}
                placeholder="German phrase (optional)"
                value={newTextGe}
                onChange={(e) => setNewTextGe(e.target.value)}
              />
            </td>
            <td style={{ padding: "4px 6px", textAlign: "right" }}>
              <button className="button" style={{ padding: "6px 12px" }} type="button" onClick={addPhrase} disabled={loading || !newText.trim()}>
                {loading ? "Adding..." : "Add"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
