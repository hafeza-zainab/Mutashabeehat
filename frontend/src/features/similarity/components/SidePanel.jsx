// frontend/src/features/similarity/components/SidePanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../../shared/context/AppContext";
import { fetchAyahContext } from "../../../shared/services/similarityApi";
import "../../../styles/SidePanel.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const getAuthHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Save tips to DB ───────────────────────────────────────────────────────────
async function saveTips(sourceSurah, sourceAyah, targetSurah, targetAyah, tips) {
  try {
    await fetch(`${API_BASE}/similarity/tip`, {
      method:  "PUT",
      headers: getAuthHeader(),
      body:    JSON.stringify({
        source_surah: sourceSurah,
        source_ayah:  sourceAyah,
        target_surah: targetSurah,
        target_ayah:  targetAyah,
        tips,
      }),
    });
    return true;
  } catch { return false; }
}

// ── Single tip row ────────────────────────────────────────────────────────────
function TipRow({ tip, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(tip);

  const save = () => { onEdit(val.trim()); setEditing(false); };

  return (
    <div style={{
      background: "#F0FDF4", border: "1px solid #BBF7D0",
      borderRadius: 8, padding: "10px 12px", marginBottom: 8,
      position: "relative",
    }}>
      {editing ? (
        <>
          <textarea
            autoFocus value={val}
            onChange={e => setVal(e.target.value)}
            rows={3}
            style={{
              width: "100%", border: "1px solid #004D40", borderRadius: 6,
              padding: "6px 8px", fontSize: 13, resize: "vertical",
              fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button
              onClick={save}
              style={{
                background: "#004D40", color: "#fff", border: "none",
                borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
              }}
            >
              Save
            </button>
            <button
              onClick={() => { setVal(tip); setEditing(false); }}
              style={{
                background: "#F3F4F6", border: "none",
                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                fontSize: 12, color: "#6B7280",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#166534", paddingRight: 52 }}>
            {tip}
          </p>
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
            <button
              onClick={() => setEditing(true)}
              title="Edit tip"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "2px 4px", fontSize: 13, borderRadius: 4,
              }}
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              title="Delete tip"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "2px 4px", fontSize: 13, borderRadius: 4, color: "#EF4444",
              }}
            >
              🗑
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main SidePanel ────────────────────────────────────────────────────────────
export default function SidePanel({ coachTips = {} }) {
  const { selectedResult, sourceAyah } = useAppContext();

  const [tips, setTips]           = useState([]);
  const [newTip, setNewTip]       = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [status, setStatus]       = useState(""); // '' | 'saved' | 'error'
  const [context, setContext]     = useState(null);
  const [loadingContext, setLoadingContext] = useState(false);

  const sourceSurah = sourceAyah?.surah;
  const sourceAyahN = sourceAyah?.ayah;
  const targetSurah = selectedResult?.target_surah;
  const targetAyah  = selectedResult?.target_ayah;

  // ── Load context whenever selected result changes ─────────────────────────
  useEffect(() => {
    if (selectedResult) {
      loadContext(selectedResult.target_surah, selectedResult.target_ayah);
    } else {
      setContext(null);
    }
  }, [selectedResult]);

  const loadContext = async (surah, ayah) => {
    setLoadingContext(true);
    try {
      const res = await fetchAyahContext(surah, ayah);
      if (res.success) setContext(res.data);
    } catch (err) {
      console.error("Failed to load context");
    } finally {
      setLoadingContext(false);
    }
  };

  // ── Load tips whenever the selected pair changes ──────────────────────────
  useEffect(() => {
    if (!selectedResult) { setTips([]); return; }

    const dbTips = (() => {
      try {
        return Array.isArray(selectedResult.tips)
          ? selectedResult.tips
          : JSON.parse(selectedResult.tips || "[]");
      } catch { return []; }
    })();

    // Merge coach-generated tips from navigation state (keyed by "surah:ayah")
    const pairKey  = `${targetSurah}:${targetAyah}`;
    const coachTip = coachTips[pairKey];
    const merged   = [...dbTips];
    if (coachTip && !merged.includes(coachTip)) merged.push(coachTip);

    setTips(merged);
  }, [selectedResult, coachTips, targetSurah, targetAyah]);

  // ── Persist updated tips list ─────────────────────────────────────────────
  const persist = useCallback(async (updatedTips) => {
    if (!sourceSurah || !sourceAyahN || !targetSurah || !targetAyah) return;
    setSaving(true);
    const ok = await saveTips(sourceSurah, sourceAyahN, targetSurah, targetAyah, updatedTips);
    setSaving(false);
    if (ok) {
      setStatus("saved");
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("error");
    }
  }, [sourceSurah, sourceAyahN, targetSurah, targetAyah]);

  const handleEdit = (idx, newText) => {
    const updated = tips.map((t, i) => i === idx ? newText : t);
    setTips(updated);
    persist(updated);
  };

  const handleDelete = (idx) => {
    const updated = tips.filter((_, i) => i !== idx);
    setTips(updated);
    persist(updated);
  };

  const handleAdd = () => {
    if (!newTip.trim()) return;
    const updated = [...tips, newTip.trim()];
    setTips(updated);
    setNewTip("");
    setAddingNew(false);
    persist(updated);
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!selectedResult) {
    return (
      <div className="side-panel-empty">
        Click a result card to view memory tips here
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="side-panel">
      <div className="panel-header">Memory Tips &amp; Context</div>
      <div className="panel-body">

        {/* ── Tips section ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <strong style={{ fontSize: 13, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
              🧠 Memory Tips
              {tips.length > 0 && (
                <span style={{
                  fontSize: 11, background: "#D1FAE5",
                  color: "#065F46", borderRadius: 10, padding: "1px 7px",
                }}>
                  {tips.length}
                </span>
              )}
              {saving && (
                <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>Saving…</span>
              )}
            </strong>
            {status === "saved" && (
              <span style={{ fontSize: 11, color: "#166534" }}>✓ Saved</span>
            )}
            {status === "error" && (
              <span style={{ fontSize: 11, color: "#991B1B" }}>⚠ Save failed</span>
            )}
          </div>

          {tips.length === 0 && !addingNew && (
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 8px", fontStyle: "italic" }}>
              No tips yet. Ask Ustadh AI or add one below.
            </p>
          )}

          {tips.map((tip, i) => (
            <TipRow
              key={i}
              tip={tip}
              onEdit={(newText) => handleEdit(i, newText)}
              onDelete={() => handleDelete(i)}
            />
          ))}

          {addingNew ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                autoFocus value={newTip}
                onChange={e => setNewTip(e.target.value)}
                placeholder="Write a memorization tip for this pair…"
                rows={3}
                style={{
                  width: "100%", fontSize: 13, borderRadius: 8,
                  border: "1.5px solid #004D40", padding: "8px 10px",
                  resize: "vertical", minHeight: 64, outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button
                  onClick={handleAdd}
                  style={{
                    background: "#004D40", color: "#fff", border: "none",
                    borderRadius: 6, padding: "5px 14px", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  Add Tip
                </button>
                <button
                  onClick={() => { setAddingNew(false); setNewTip(""); }}
                  style={{
                    background: "#F3F4F6", border: "none", borderRadius: 6,
                    padding: "5px 10px", cursor: "pointer", fontSize: 12, color: "#6B7280",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              style={{
                background: "none", border: "1px dashed #9CA3AF", borderRadius: 6,
                padding: "5px 12px", cursor: "pointer", fontSize: 12,
                color: "#6B7280", width: "100%", marginTop: 4,
                transition: "border-color .15s, color .15s",
                display: "flex", alignItems: "center", gap: 6,
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "#004D40"; e.currentTarget.style.color = "#004D40"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "#9CA3AF"; e.currentTarget.style.color = "#6B7280"; }}
            >
              + Add a tip manually
            </button>
          )}
        </div>

        {/* ── Divider ── */}
        <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "0 0 16px" }} />

        {/* ── Context section ── */}
        <div className="context-container">
          {loadingContext ? (
            <div className="loading-text">Loading context...</div>
          ) : context ? (
            <>
              {context.prev && (
                <div className="context-ayah prev">
                  <div className="context-label">Previous Ayah</div>
                  <div className="arabic-text-sm" dir="rtl">{context.prev}</div>
                </div>
              )}
              <div className="context-ayah main">
                <div className="context-label">
                  Selected Ayah (Surah {selectedResult.target_surah}:{selectedResult.target_ayah})
                </div>
                <div className="arabic-text-sm main-text" dir="rtl">{context.current}</div>
              </div>
              {context.next && (
                <div className="context-ayah next">
                  <div className="context-label">Next Ayah</div>
                  <div className="arabic-text-sm" dir="rtl">{context.next}</div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ── Match analysis ── */}
        <div className="tip-context">
          <strong>Match Analysis</strong>
          <p className="highlight-mode">
            Focus on: <span>{selectedResult.highlight_mode}</span>
          </p>
          <p>
            Similarity Score: <span>{Math.round(selectedResult.similarity_score * 100)}%</span>
          </p>
        </div>

      </div>
    </div>
  );
}