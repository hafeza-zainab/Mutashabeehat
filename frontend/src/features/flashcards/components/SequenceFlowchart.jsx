// C:\quran-similarity-app\frontend\src\features\flashcards\components\SequenceFlowchart.jsx
import React, { useState, useRef, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const getAuthHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Detect set type and number from set name ──────────────────────────────────
// Returns { type: "surah" | "page" | "juz", num: Number } or null
function detectSetInfo(setName) {
  // Page: "Page 582", "Page 582 Sequence", "pg 100"
  const pageMatch = setName.match(/\b(?:page|pg\.?)\s*(\d{1,3})\b/i);
  if (pageMatch) return { type: "page", num: parseInt(pageMatch[1]) };

  // Juz: "Juz 20", "Para 5"
  const juzMatch = setName.match(/\b(?:juz|juzz|para|sipara)\s*(\d{1,2})\b/i);
  if (juzMatch) return { type: "juz", num: parseInt(juzMatch[1]) };

  // Surah: "(112)", "Surah 112", "Surah Al-Ikhlas (112)"
  const bracketMatch = setName.match(/\((\d{1,3})\)/);
  if (bracketMatch) return { type: "surah", num: parseInt(bracketMatch[1]) };
  const surahWordMatch = setName.match(/\bsurah\s+(\d{1,3})\b/i);
  if (surahWordMatch) return { type: "surah", num: parseInt(surahWordMatch[1]) };

  // Plain number fallback — assume surah
  const plainNum = setName.match(/\b(\d{1,3})\b/);
  if (plainNum) return { type: "surah", num: parseInt(plainNum[1]) };

  return null;
}

// ── Build the printable HTML string ──────────────────────────────────────────
function buildPrintHTML(ayahs, setName, view, story) {
  const mnemonicChain  = ayahs.map(a => a.firstWord).join(" ← ");
  const flowchartNodes = ayahs.map((a, i) => `
    <div class="node">
      <div class="node-badge">${a.ayah}</div>
      <div class="node-word">${a.firstWord}</div>
      <div class="node-label">Ayah ${a.ayah}</div>
    </div>
    ${i < ayahs.length - 1 ? '<div class="arrow-line"></div><div class="arrow-head"></div>' : ""}
  `).join("");
  const tableRows = ayahs.map((a, i) => `
    <tr class="${i % 2 === 0 ? "row-even" : "row-odd"}">
      <td class="cell-num">${a.ayah}</td>
      <td class="cell-word">${a.firstWord}</td>
      <td class="cell-text">${a.text}</td>
    </tr>
  `).join("");
  const storyBlock = story ? `
    <div class="story-box">
      <div class="story-title">📖 Mnemonic Story</div>
      <div class="story-text">${story.replace(/\n/g, "<br/>")}</div>
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="ar" dir="ltr">
<head>
  <meta charset="utf-8"/>
  <title>Sequence Memory Aid — ${setName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      background: white;
      padding: 32px 40px;
      color: #111827;
    }
    /* ── Header ── */
    .header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 2px solid #004D40;
    }
    .header-title { font-size: 22px; font-weight: 700; color: #004D40; margin-bottom: 6px; }
    .header-sub   { font-size: 13px; color: #6B7280; }
    /* ── Mnemonic chain ── */
    .mnemonic-label {
      font-size: 11px; font-weight: 700; letter-spacing: .12em;
      text-transform: uppercase; color: #6B7280;
      text-align: center; margin-bottom: 8px;
    }
    .mnemonic-box {
      background: #E6F4F1; border: 1.5px solid #004D40; border-radius: 10px;
      padding: 14px 20px; margin-bottom: 28px; text-align: center;
      direction: rtl; font-family: 'Traditional Arabic', 'Amiri', serif;
      font-size: 22px; font-weight: 700; color: #004D40;
      line-height: 1.8; letter-spacing: 2px;
    }
    /* ── Flowchart ── */
    .flowchart { display: flex; flex-direction: column; align-items: center; margin-bottom: 28px; }
    .node {
      background: linear-gradient(135deg, #004D40 0%, #00695C 100%);
      color: white; border-radius: 12px; padding: 14px 24px;
      min-width: 160px; max-width: 220px; text-align: center;
      position: relative; margin-top: 14px;
      box-shadow: 0 3px 10px rgba(0,77,64,0.28);
    }
    .node-badge {
      position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
      background: #F2C94C; color: #1a1a1a; border-radius: 50%;
      width: 24px; height: 24px; font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    .node-word {
      font-family: 'Traditional Arabic', 'Amiri', serif;
      font-size: 24px; font-weight: 700; direction: rtl;
      margin-bottom: 5px; line-height: 1.4;
    }
    .node-label { font-size: 11px; opacity: 0.72; direction: ltr; }
    .arrow-line { width: 2px; height: 28px; background: #004D40; margin: 0 auto; }
    .arrow-head {
      width: 0; height: 0;
      border-left: 7px solid transparent; border-right: 7px solid transparent;
      border-top: 10px solid #004D40; margin: 0 auto;
    }
    /* ── Table ── */
    .table-section { margin-bottom: 28px; }
    .table-title {
      font-size: 13px; font-weight: 700; color: #004D40;
      margin-bottom: 10px; text-transform: uppercase; letter-spacing: .1em;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #004D40; color: white; }
    thead th { padding: 10px 14px; text-align: left; font-size: 13px; }
    thead th:nth-child(2), thead th:nth-child(3) { text-align: right; direction: rtl; }
    .row-even { background: #F8FAFC; }
    .row-odd  { background: white; }
    .cell-num  { padding: 9px 14px; text-align: center; font-weight: 700; color: #004D40; font-size: 14px; width: 60px; }
    .cell-word { padding: 9px 14px; text-align: right; direction: rtl; font-family: 'Traditional Arabic','Amiri',serif; font-size: 18px; font-weight: 700; color: #004D40; width: 160px; }
    .cell-text { padding: 9px 14px; text-align: right; direction: rtl; font-family: 'Traditional Arabic','Amiri',serif; font-size: 15px; color: #374151; line-height: 1.7; }
    /* ── Story box ── */
    .story-box { background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
    .story-title { font-size: 13px; font-weight: 700; color: #92400E; margin-bottom: 10px; }
    .story-text  { font-size: 14px; line-height: 1.85; color: #1a1a1a; }
    /* ── Footer ── */
    .footer {
      text-align: center; font-size: 11px; color: #9CA3AF;
      border-top: 1px solid #E5E7EB; padding-top: 14px; margin-top: 8px;
    }
    /* ── Print overrides ── */
    @media print {
      body { padding: 20px 24px; }
      .node { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .node-badge  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .mnemonic-box{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead tr     { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print    { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">📊 Sequence Memory Aid</div>
    <div class="header-sub">${setName} · ${ayahs.length} ayahs · Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>

  <!-- Mnemonic chain (always shown) -->
  <div class="mnemonic-label">First-Word Sequence (read right → left)</div>
  <div class="mnemonic-box">${mnemonicChain}</div>

  <!-- Story (if available) -->
  ${storyBlock}

  <!-- Flowchart -->
  <div class="mnemonic-label" style="margin-bottom:0">Flowchart</div>
  <div class="flowchart">${flowchartNodes}</div>

  <!-- Full table -->
  <div class="table-section">
    <div class="table-title">Complete Ayah Reference</div>
    <table>
      <thead>
        <tr>
          <th style="text-align:center">Ayah</th>
          <th>First Word</th>
          <th>Full Text</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <div class="footer">حفظ القرآن · Hifz al-Quran Platform</div>
</body>
</html>`;
}

// ── Flowchart node (in-page view) ─────────────────────────────────────────────
function FlowNode({ ayah, firstWord, isLast }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        background: "linear-gradient(135deg, #004D40 0%, #00695C 100%)",
        color: "#fff", borderRadius: 12,
        padding: "14px 20px", minWidth: 140, maxWidth: 200,
        textAlign: "center", boxShadow: "0 3px 10px rgba(0,77,64,0.25)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          background: "#F2C94C", color: "#1a1a1a", borderRadius: "50%",
          width: 22, height: 22, fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}>
          {ayah}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, direction: "rtl", fontFamily: "serif", marginBottom: 5, lineHeight: 1.4 }}>
          {firstWord}
        </div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>Ayah {ayah}</div>
      </div>
      {!isLast && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "4px 0" }}>
          <div style={{ width: 2, height: 24, background: "#004D40" }} />
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #004D40" }} />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SequenceFlowchart({ setName }) {
  const [open,      setOpen]      = useState(false);
  const [ayahs,     setAyahs]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [surahNum,  setSurahNum]  = useState(null);
  const [view,      setView]      = useState("flowchart"); // "flowchart" | "mnemonic" | "story"
  const [story,     setStory]     = useState("");
  const [storyLoad, setStoryLoad] = useState(false);
  const chartRef = useRef(null);

  // ── Fetch ayah data ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const info = detectSetInfo(setName);
    if (!info) {
      setError("Could not detect a Surah, Page, or Juz number from the set name. Try naming it e.g. 'Surah 112', 'Page 582', or 'Juz 30'.");
      return;
    }
    const { type, num } = info;
    if (type === "surah" && (num < 1 || num > 114)) { setError("Surah number must be between 1 and 114.");   return; }
    if (type === "page"  && (num < 1 || num > 604)) { setError("Page number must be between 1 and 604.");    return; }
    if (type === "juz"   && (num < 1 || num > 30))  { setError("Juz number must be between 1 and 30.");      return; }

    setSurahNum(type === "surah" ? num : null);
    setLoading(true);
    setError("");
    try {
      const url =
        type === "page" ? `${API_BASE}/ayah/page/${num}/full` :
        type === "juz"  ? `${API_BASE}/ayah/juz/${num}/full`  :
                          `${API_BASE}/ayah/${num}/full`;

      const res  = await fetch(url, { headers: getAuthHeader() });
      const json = await res.json();

      if (json.success) {
        if (type === "page" && json.data?.surahs) {
          // Page response: ayahs nested under surahs[]
          setAyahs(json.data.surahs.flatMap(s =>
            s.ayahs.map(a => ({
              ayah:      `${s.surah}:${a.ayah}`,
              text:      a.text,
              firstWord: a.firstWord || a.text.trim().split(/\s+/)[0] || "",
            }))
          ));
        } else if (type === "juz" && json.data?.entries) {
          // Juz response: entries[] each with ayahs[]
          setAyahs(json.data.entries.flatMap(e =>
            (e.ayahs || []).map(a => ({
              ayah:      `${e.surah}:${a.ayah}`,
              text:      a.text,
              firstWord: a.firstWord || a.text.trim().split(/\s+/)[0] || "",
            }))
          ));
        } else if (json.data?.ayahs) {
          // Surah response: flat ayahs[]
          setSurahNum(num);
          setAyahs(json.data.ayahs.map(a => ({
            ayah:      a.ayah,
            text:      a.text,
            firstWord: a.firstWord || a.text.trim().split(/\s+/)[0] || "",
          })));
        } else {
          setError("Unexpected response format from server.");
        }
      } else if (type === "surah") {
        // Surah fallback: /first-words endpoint
        const res2  = await fetch(`${API_BASE}/ayah/${num}/first-words`, { headers: getAuthHeader() });
        const json2 = await res2.json();
        if (json2.success) setAyahs(json2.data);
        else setError("Failed to load ayah data.");
      } else {
        setError("Failed to load data for this set.");
      }
    } catch {
      setError("Network error loading ayah data.");
    } finally {
      setLoading(false);
    }
  }, [setName]);

  const handleOpen = () => {
    setOpen(true);
    if (ayahs.length === 0) fetchData();
  };

  // ── Generate AI mnemonic story ─────────────────────────────────────────────
  const generateStory = async () => {
    if (story) { setView("story"); return; }
    setStoryLoad(true);
    setView("story");
    try {
      const firstWords = ayahs.map(a => a.firstWord).join("، ");
      const res = await fetch(`${API_BASE}/coach/chat`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          system: `You are a Quran memorization coach. When given first words of ayahs, create a short mnemonic story in English (under 80 words) that uses those Arabic words as anchors to help remember their sequence. Do NOT translate the Arabic words. End with the sequence: word1 ← word2 ← word3...`,
          messages: [{ role: "user", content: `Surah ${surahNum} first words in order: ${firstWords}` }],
        }),
      });
      const json = await res.json();
      setStory(json.content?.[0]?.text || "Could not generate story.");
    } catch {
      setStory("Could not generate story. Please try again.");
    } finally {
      setStoryLoad(false);
    }
  };

  // ── Open print/download window ─────────────────────────────────────────────
  const openPrintWindow = useCallback((forPrint = false) => {
    const html = buildPrintHTML(ayahs, setName, view, story);
    const win  = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Please allow popups for this site to use print/download."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    if (forPrint) {
      win.onload = () => { win.focus(); win.print(); };
      // Fallback if onload doesn't fire (e.g. same-origin quirks)
      setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 800);
    }
  }, [ayahs, setName, view, story]);

  const handlePrint    = () => openPrintWindow(true);
  const handleDownload = () => openPrintWindow(false);

  // ── Collapsed button ───────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        style={{
          background: "none", border: "1px dashed #004D40",
          borderRadius: 8, padding: "8px 16px",
          cursor: "pointer", fontSize: 13, color: "#004D40",
          display: "flex", alignItems: "center", gap: 6,
          margin: "12px 0", width: "100%", justifyContent: "center",
          transition: "background .15s",
        }}
        onMouseOver={e => e.currentTarget.style.background = "#E6F4F1"}
        onMouseOut={e  => e.currentTarget.style.background = "none"}
      >
        📊 Generate Sequence Memory Aid
      </button>
    );
  }

  // ── Expanded panel ─────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 20, border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

      {/* Header bar */}
      <div style={{ background: "#004D40", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>📊 Sequence Memory Aid — {setName}</span>
        <button onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>
          ×
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: "#FAFAFA", borderBottom: "1px solid #E5E7EB" }}>
        {[
          { id: "flowchart", label: "🔽 Flowchart"  },
          { id: "mnemonic",  label: "🔤 First Words" },
          { id: "story",     label: "📖 AI Story"    },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => tab.id === "story" ? generateStory() : setView(tab.id)}
            style={{
              flex: 1, padding: "10px 6px", border: "none",
              borderBottom: view === tab.id ? "2px solid #004D40" : "2px solid transparent",
              background: "none", cursor: "pointer", fontSize: 12,
              fontWeight: view === tab.id ? 700 : 400,
              color: view === tab.id ? "#004D40" : "#6B7280",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, background: "white", maxHeight: 480, overflowY: "auto" }}>
        {loading && (
          <div style={{ textAlign: "center", color: "#6B7280", padding: 24 }}>
            Loading ayah data…
          </div>
        )}

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991B1B" }}>
            {error}
          </div>
        )}

        {!loading && !error && ayahs.length > 0 && (
          <>
            {/* ── FLOWCHART ── */}
            {view === "flowchart" && (
              <div ref={chartRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12 }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14, background: "#F0FDF4", borderRadius: 8, padding: "6px 14px", border: "1px solid #BBF7D0" }}>
                  {ayahs.length} ayahs · Top → Bottom
                </div>
                {ayahs.map((a, i) => (
                  <FlowNode key={a.ayah} ayah={a.ayah} firstWord={a.firstWord} isLast={i === ayahs.length - 1} />
                ))}
              </div>
            )}

            {/* ── MNEMONIC / FIRST WORDS ── */}
            {view === "mnemonic" && (
              <div ref={chartRef}>
                {/* Arrow chain */}
                <div style={{
                  direction: "rtl", fontSize: 18, fontFamily: "serif",
                  textAlign: "center", padding: "14px 8px",
                  background: "#F8FAFC", borderRadius: 10,
                  border: "1px solid #E5E7EB", marginBottom: 16, lineHeight: 2.4,
                }}>
                  {ayahs.map((a, i) => (
                    <span key={a.ayah}>
                      <span style={{ background: "#004D40", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 17, fontWeight: 700, display: "inline-block" }}>
                        {a.firstWord}
                      </span>
                      {i < ayahs.length - 1 && (
                        <span style={{ color: "#9CA3AF", fontSize: 16, margin: "0 6px", direction: "ltr", display: "inline-block" }}>←</span>
                      )}
                    </span>
                  ))}
                </div>
                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#004D40", color: "#fff" }}>
                      <th style={{ padding: "8px 10px", textAlign: "center", width: 55 }}>Ayah</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", direction: "rtl", width: 120 }}>First Word</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", direction: "rtl" }}>Full Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ayahs.map((a, i) => (
                      <tr key={a.ayah} style={{ background: i % 2 === 0 ? "#F8FAFC" : "white" }}>
                        <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#004D40" }}>{a.ayah}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", direction: "rtl", fontFamily: "serif", fontSize: 16, fontWeight: 700 }}>{a.firstWord}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", direction: "rtl", fontFamily: "serif", fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{a.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── AI STORY ── */}
            {view === "story" && (
              <div ref={chartRef}>
                {storyLoad ? (
                  <div style={{ textAlign: "center", padding: 24, color: "#6B7280" }}>
                    ✨ Generating mnemonic story…
                  </div>
                ) : (
                  <>
                    <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.8, marginBottom: 14 }}>
                      {story || "Click the AI Story tab to generate a mnemonic story."}
                    </div>
                    <div style={{ direction: "rtl", textAlign: "center", fontSize: 18, fontFamily: "serif", background: "#E6F4F1", borderRadius: 8, padding: "10px 14px", border: "1px solid #004D40", color: "#004D40" }}>
                      {ayahs.map((a, i) => (
                        <span key={a.ayah}>
                          <strong>{a.firstWord}</strong>
                          {i < ayahs.length - 1 && <span style={{ margin: "0 6px", opacity: 0.5 }}>←</span>}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      {!loading && ayahs.length > 0 && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E7EB", background: "#FAFAFA", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9CA3AF", marginRight: "auto" }}>
            Opens in a new tab — use your browser's Save/Print
          </span>
          <button onClick={handleDownload}
            style={{ background: "none", border: "1px solid #004D40", color: "#004D40", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            🔗 Open / Save
          </button>
          <button onClick={handlePrint}
            style={{ background: "#004D40", border: "none", color: "#fff", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            🖨️ Print
          </button>
        </div>
      )}
    </div>
  );
}