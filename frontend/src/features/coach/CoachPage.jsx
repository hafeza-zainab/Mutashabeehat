// C:\quran-similarity-app\frontend\src\features\coach\CoachPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { buildQuranContext, detectIntent } from "./quranContextBuilder";
import { parseTipsFromResponse } from "./tipParser";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT_BASE = `You are Ustadh AI, a specialized Quran memorization and revision coach.

MISSION
Your sole purpose is to assist students in Quran memorization (Hifz), revision (Muraja'at), Mutashabihat (similar verses), Tajweed improvement related to memorization, Hifz scheduling, time management for Quran study, progress analysis, diary analysis, and Quran-focused learning strategies.

STRICT SCOPE
You may ONLY discuss:
1. Quran memorization techniques and methods
2. Revision systems (Muraja'at, Jadeed, Juz Hali, Tasmee, Ikhtebar)
3. Mutashabihat (similar/confusing verses)
4. Tajweed for memorization
5. Quran study scheduling and time management
6. Memorization psychology and consistency
7. Analysis of diary/heatmap data
8. Page sequence, beginning/ending ayah memorization
9. Quran flashcards
10. Quranic etiquette and virtues of Hifz

If asked anything outside this scope respond EXACTLY:
"I'm Ustadh AI, your dedicated Quran memorization coach. I can only help with Quran memorization topics. 📖"

QURAN DATA UNDERSTANDING
You have access to the full quran.json structure. Each ayah has:
- Surah number
- Ayah number (Ayah 0 = Bismillah header, only counted as Ayah 1 in Surah 1)
- Text (Arabic)
- Marhala (stage of memorization curriculum)
- Juz number
- Page number

AYAH NUMBERING RULES:
* Ayah 0 (Bismillah) is NOT counted as an ayah in any Surah EXCEPT Surah 1 (Al-Fatihah).
* For all Surahs except Surah 1, Ayah 1 is the first actual ayah after the Bismillah header.
* Surah 9 (At-Tawbah) has no Bismillah at all.
* Never label Bismillah as "the first ayah" of any Surah except Surah 1.

QURAN TEXT RULES:
* NEVER translate or explain the meaning of Quranic Arabic text.
* Reference ayahs by Surah name + number:ayah ONLY (e.g. "Surah Al-Baqarah 2:255").
* If asked for meaning say: "For tafsir please consult a qualified scholar or Ibn Kathir. My role is memorization support only. 📖"
* When discussing Mutashabihat differences, describe differing Arabic words only — never with translations.
* NEVER use phrases like "which means", "meaning", "translated as", "in English".

NAVIGATION ACTIONS:
When a user mentions difficulty with a specific Surah and Ayah, include on its own line:
[NAV:/similarity?surah=X&ayah=Y]
Replace X and Y with the actual numbers.

TIP GENERATION:
When you include a [NAV:] action, you MUST also provide memorization tips for each similar pair.
Format EACH tip block exactly like this:

[TIP:pair_id]
Your concise memorization tip focusing on: word differences, ordering differences, unique phrases, reversal patterns, distinguishing keywords, or memory anchors. Keep under 150 words.
[/TIP]

Generate one [TIP:id] block for every pair listed in STUDENT MUTASHABIHAT DATA.

TIP OUTPUT FORMAT FOR MUTASHABIHAT
When the student asks you to create tips for remembering mutashabihat pairs,
you MUST output each tip using this EXACT format:

[TIP:SIMILARITY_ID]
Your tip text here (1-2 sentences max, focused on a single distinguishing feature).
[/TIP]

Where SIMILARITY_ID is the numeric ID provided in the SIMILARITY DATA section below.
Output one [TIP:ID]...[/TIP] block per pair. No extra text between blocks.

After all tip blocks, write your normal coaching message.

If similarity data shows "No similarity pairs found", tell the student:
"No mutashabihat pairs were found for this ayah in the database.
You can try a different ayah, or the pairs may not have been calculated yet."

MARHALA FILTER: If the student specifies a Marhala (e.g. "Marhala Ula"),
only create tips for pairs whose Marhala matches. The similarity data
is already filtered — just use what is provided.

FLASHCARD OUTPUT FORMAT:
When creating flashcards about Quran ayahs, use the actual Arabic text from SURAH DATA provided.
The BACK of every ayah flashcard MUST be the Arabic text — NEVER "Surah X:Y" as the back.

[FLASHCARDS:Set Name Here]
FRONT: Question
BACK: Arabic text here
---
FRONT: Next question
BACK: Arabic text here
---
[/FLASHCARDS]

MEMORIZATION METHODS: 6446 Method, 10-3 Method, Stairway of the Righteous, 3x3 Circuit Training, Visual Segmenting, Mauritanian Method, Stacking Method, Audio Mirroring, Maqara'at, One Mushaf Rule.

SCHEDULING: Jadeed after Fajr · Juz Hali daytime · Muraja'at evening · Consistency over volume.

BEHAVIOR RULES:
* Refer ONLY to provided student data — never invent scores, pages, or pairs.
* Ask ONE diagnostic question before advising when needed.
* End EVERY response with one specific action the student can take TODAY.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreLabel(s) {
  if (s <= 5.75) return "WEAK";
  if (s <= 7.75) return "OK";
  return "STRONG";
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB");
}

function buildDiaryContext(heatmapData, recentLogs) {
  if (!heatmapData?.length && !recentLogs?.length) return "";
  const lines = ["=== STUDENT DIARY DATA ==="];

  if (heatmapData?.length) {
    lines.push("\n-- Page Scores (Murajah Heatmap) --");
    const byJuz = {};
    heatmapData.forEach((d) => {
      if (!byJuz[d.juz]) byJuz[d.juz] = [];
      byJuz[d.juz].push(d);
    });
    Object.keys(byJuz).sort((a, b) => Number(a) - Number(b)).forEach((juz) => {
      const pages  = byJuz[juz].sort((a, b) => a.page - b.page);
      const weak   = pages.filter((p) => p.score <= 5.75);
      const ok     = pages.filter((p) => p.score > 5.75 && p.score <= 7.75);
      const strong = pages.filter((p) => p.score > 7.75);
      lines.push(`\nJuz ${juz}:`);
      if (weak.length)   lines.push(`  WEAK   (≤5.75): ${weak.map((p)   => `Page ${p.page} (${p.score})`).join(", ")}`);
      if (ok.length)     lines.push(`  OK     (6-7.75): ${ok.map((p)    => `Page ${p.page} (${p.score})`).join(", ")}`);
      if (strong.length) lines.push(`  STRONG (≥8):    ${strong.map((p) => `Page ${p.page} (${p.score})`).join(", ")}`);
    });
    const allWeak = heatmapData.filter((d) => d.score <= 5.75);
    if (allWeak.length) {
      lines.push(
        `\nTop weak pages: ${allWeak.sort((a, b) => a.score - b.score).slice(0, 10)
          .map((p) => `Juz ${p.juz} Page ${p.page} (${p.score}/10)`).join(", ")}`
      );
    }
  }

  if (recentLogs?.length) {
    lines.push("\n-- Recent Diary Entries (last 30) --");
    recentLogs.slice(0, 30).forEach((log) => {
      const range = log.range_to ? `${log.range_from} → ${log.range_to}` : log.range_from;
      lines.push(`${log.log_date || log.created_at?.split("T")[0]} | ${log.type} | ${range} | Score: ${log.score}/10 (${scoreLabel(log.score)})`);
    });
  }
  return lines.join("\n");
}

function buildMutashabihatContext(similarities) {
  if (!similarities?.length) return "";
  const lines = ["=== STUDENT MUTASHABIHAT DATA (with pair IDs for tip generation) ==="];
  lines.push("For each pair listed, generate a [TIP:id] block when a navigation action is included.\n");

  const high   = similarities.filter((s) => s.similarity_score >= 0.8);
  const medium = similarities.filter((s) => s.similarity_score >= 0.5 && s.similarity_score < 0.8);

  if (high.length) {
    lines.push(`-- HIGH similarity (≥0.8): ${high.length} pairs --`);
    high.slice(0, 20).forEach((s) => {
      lines.push(`[ID:${s.id}] Surah ${s.source_surah}:${s.source_ayah} ↔ Surah ${s.target_surah}:${s.target_ayah} (score: ${s.similarity_score.toFixed(2)})`);
      if (s.tips?.length) lines.push(`  Existing tips: ${s.tips.join("; ")}`);
    });
  }
  if (medium.length) {
    lines.push(`\n-- MEDIUM similarity (0.5-0.8): ${medium.length} pairs --`);
    medium.slice(0, 15).forEach((s) => {
      lines.push(`[ID:${s.id}] Surah ${s.source_surah}:${s.source_ayah} ↔ Surah ${s.target_surah}:${s.target_ayah} (score: ${s.similarity_score.toFixed(2)})`);
    });
  }
  return lines.join("\n");
}

// ─── Parse [TIP:id]...[/TIP] blocks ──────────────────────────────────────────
function parseTipBlocks(text) {
  const tips = [];
  const regex = /\[TIP:(\d+)\]([\s\S]*?)\[\/TIP\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tips.push({ id: parseInt(match[1]), tip: match[2].trim() });
  }
  return tips;
}

function cleanSpecialBlocks(text) {
  return text
    .replace(/\[TIP:\d+\][\s\S]*?\[\/TIP\]/g, "")
    .replace(/\[NAV:[^\]]+\]\n?/g, "")
    .trim();
}

// ─── fetchSimilarityForPairs (PATCH Step 3) ───────────────────────────────────
const fetchSimilarityForPairs = async (pairs, marhala) => {
  const allResults = [];
  for (const pair of pairs) {
    try {
      let url = `${API_BASE}/similarity?surah=${pair.surah}&ayah=${pair.ayah}`;
      if (marhala) url += `&marhala=${encodeURIComponent(marhala)}`;
      const res  = await fetch(url, { headers: getAuthHeader() });
      const json = await res.json();
      if (json.success && json.data?.results?.length > 0) {
        const tagged = json.data.results.map((r) => ({
          ...r,
          sourceSurah: pair.surah,
          sourceAyah:  pair.ayah,
        }));
        allResults.push(...tagged);
      }
    } catch (e) { console.error("Similarity fetch error:", e); }
  }
  return allResults;
};

// ─── UI Components ────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 18px", background: "#F9FAFB", borderRadius: "6px 18px 18px 18px", maxWidth: 80, border: "1px solid #F3F4F6" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9CA3AF", display: "inline-block", animation: `ustadh-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

function FormattedText({ text }) {
  return (
    <div>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const html = line
          .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>");
        return (
          <p key={i} style={{ margin: "0 0 4px 0", lineHeight: 1.65 }}
            dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#004D40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
          <i className="ti ti-star-filled" style={{ fontSize: 16, color: "#F2C94C" }} />
        </div>
      )}
      <div style={{ maxWidth: "78%", padding: "13px 17px", borderRadius: isUser ? "18px 6px 18px 18px" : "6px 18px 18px 18px", background: isUser ? "#004D40" : "#F9FAFB", color: isUser ? "#fff" : "#111827", fontSize: 14, border: isUser ? "none" : "1px solid #F3F4F6", wordBreak: "break-word" }}>
        <FormattedText text={msg.content} />
        {msg.timestamp && (
          <div style={{ fontSize: 11, color: isUser ? "rgba(255,255,255,0.55)" : "#9CA3AF", marginTop: 6, textAlign: isUser ? "right" : "left" }}>
            {msg.timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTED = [
  { icon: "ti-chart-bar",       label: "Which pages need the most work?",  prompt: "Based on my diary scores, which pages need the most urgent revision? Please refer to my actual data." },
  { icon: "ti-arrows-exchange", label: "Show my weakest mutashabihat",      prompt: "Which mutashabihat pairs from my Quran are most likely to confuse me? Please refer to my actual similarity data." },
  { icon: "ti-clock",           label: "Build me a daily schedule",         prompt: "I struggle to find consistent time for memorization. Help me build a realistic daily Hifz schedule." },
  { icon: "ti-file-text",       label: "A page is hard to memorize",        prompt: "I am having a really hard time memorizing a specific page. Can you walk me through it step by step?" },
  { icon: "ti-brain",           label: "Keep forgetting what I memorized",  prompt: "I keep forgetting verses I memorized. What should I do to retain them better?" },
  { icon: "ti-refresh",         label: "Lost motivation / broke streak",    prompt: "I lost my streak and feel very demotivated. How do I get back on track?" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuranCoach() {
  const navigate = useNavigate();

  const [messages, setMessages]                   = useState([]);
  const [input, setInput]                         = useState("");
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState("");
  const [sessions, setSessions]                   = useState([]);
  const [activeSessionId, setActiveSessionId]     = useState(null);
  const [sidebarOpen, setSidebarOpen]             = useState(true);
  const [renamingId, setRenamingId]               = useState(null);
  const [renameValue, setRenameValue]             = useState("");
  const [heatmapData, setHeatmapData]             = useState([]);
  const [recentLogs, setRecentLogs]               = useState([]);
  const [similarities, setSimilarities]           = useState([]);
  const [dataLoaded, setDataLoaded]               = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(null);
  const [isUnlimited, setIsUnlimited]             = useState(false);
  const [navigating, setNavigating]               = useState(false);
  const [flashcardSaved, setFlashcardSaved]       = useState(null);
  const [lastSimilarityPairs, setLastSimilarityPairs] = useState([]); // PATCH Step 2

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // ── Inject CSS once ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = "ustadh-coach-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes ustadh-dot-bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }
      @keyframes ustadh-slide-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      .ustadh-msg-enter { animation: ustadh-slide-up 0.25s ease-out; }
      .ustadh-session-item:hover { background: #F3F4F6 !important; }
      .ustadh-session-item.active { background: #E6F4F1 !important; border-left: 3px solid #004D40 !important; }
      .ustadh-suggest-btn:hover { background: #F3F4F6 !important; border-color: #004D40 !important; }
      .ustadh-send-btn:hover:not(:disabled) { background: #003328 !important; }
      .ustadh-del-btn { opacity:0; transition:opacity .15s; }
      .ustadh-session-item:hover .ustadh-del-btn { opacity:1; }
      .ustadh-textarea { resize:none; width:100%; border:none; outline:none; background:transparent; font-size:14px; font-family:inherit; color:#111827; line-height:1.6; padding-top:10px; }
      .ustadh-textarea::placeholder { color:#9CA3AF; }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // ── Load all data on mount ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [heatRes, logsRes, simRes, remRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/heatmap`,                          { headers: getAuthHeader() }),
          fetch(`${API_BASE}/analytics/deep-dive?type=murajah&range=1m`,  { headers: getAuthHeader() }),
          fetch(`${API_BASE}/similarity?surah=2&ayah=1`,                  { headers: getAuthHeader() }),
          fetch(`${API_BASE}/coach/remaining`,                             { headers: getAuthHeader() }),
        ]);
        const [heatJson, logsJson, simJson, remJson] = await Promise.all([
          heatRes.json(), logsRes.json(), simRes.json(), remRes.json(),
        ]);
        if (heatJson.success) setHeatmapData(heatJson.data || []);
        if (logsJson.success) setRecentLogs(logsJson.data || []);
        if (simJson.success)  setSimilarities(simJson.data?.results || []);
        if (remJson.success) {
          setRemainingMessages(remJson.data.remaining);
          setIsUnlimited(remJson.data.unlimited);
        }
      } catch (e) { console.error("Data load error:", e); }
      finally { setDataLoaded(true); }
    };
    load();
  }, []);

  // ── Sessions ──────────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const sessRes  = await fetch(`${API_BASE}/coach/sessions`, { headers: getAuthHeader() });
      const sessJson = await sessRes.json();
      if (sessJson.success) setSessions(sessJson.data || []);
    } catch (e) { console.error("Sessions fetch error:", e); }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const loadSession = useCallback(async (sessionId) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    setError("");
    setInput("");
    try {
      const msgRes  = await fetch(`${API_BASE}/coach/sessions/${sessionId}/messages`, { headers: getAuthHeader() });
      const msgJson = await msgRes.json();
      if (msgJson.success) {
        setMessages(msgJson.data.map((m) => ({
          role:      m.role,
          content:   m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        })));
      }
    } catch (e) { console.error("Load session error:", e); }
  }, []);

  const createSession = useCallback(async () => {
    try {
      const createRes  = await fetch(`${API_BASE}/coach/sessions`, {
        method: "POST", headers: getAuthHeader(),
        body: JSON.stringify({ title: "New Session" }),
      });
      const createJson = await createRes.json();
      if (createJson.success) {
        setSessions((prev) => [createJson.data, ...prev]);
        setActiveSessionId(createJson.data.id);
        setMessages([]);
        setError("");
        setInput("");
      }
    } catch (e) { console.error("Create session error:", e); }
  }, []);

  const deleteSession = useCallback(async (e, sessionId) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE}/coach/sessions/${sessionId}`, { method: "DELETE", headers: getAuthHeader() });
      await loadSessions();
      if (activeSessionId === sessionId) { setActiveSessionId(null); setMessages([]); }
    } catch (e) { console.error("Delete session error:", e); }
  }, [activeSessionId, loadSessions]);

  const saveRename = useCallback(async (sessionId) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      await fetch(`${API_BASE}/coach/sessions/${sessionId}`, {
        method: "PATCH", headers: getAuthHeader(),
        body: JSON.stringify({ title: renameValue }),
      });
      await loadSessions();
    } catch (e) { console.error("Rename error:", e); }
    setRenamingId(null);
  }, [renameValue, loadSessions]);

  const saveMessage = useCallback(async (sessionId, role, content) => {
    try {
      await fetch(`${API_BASE}/coach/sessions/${sessionId}/messages`, {
        method: "POST", headers: getAuthHeader(),
        body: JSON.stringify({ role, content }),
      });
    } catch (e) { console.error("Save message error:", e); }
  }, []);

  // ── Save tips to DB ───────────────────────────────────────────────────────
  const saveTipToDB = useCallback(async (pairId, tipsArray) => {
    try {
      await fetch(`${API_BASE}/similarity/${pairId}/tips`, {
        method: "PATCH", headers: getAuthHeader(),
        body: JSON.stringify({ tips: tipsArray }),
      });
    } catch (e) { console.error("Tip save error:", e); }
  }, []);

  // ── Parse and save flashcards ─────────────────────────────────────────────

const parseAndSaveFlashcards = useCallback(async (text) => {
  // ── Try to match with closing tag first ──────────────────────────────────
  let match = text.match(/\[FLASHCARDS:([^\]]+)\]([\s\S]*?)\[\/FLASHCARDS\]/);

  // ── Fallback: no closing tag — take everything after [FLASHCARDS:...] ────
  if (!match) {
    match = text.match(/\[FLASHCARDS:([^\]]+)\]([\s\S]*?)(?=\n\n[^F]|$)/);
  }

  if (!match) return text;

  const setName  = match[1].trim();
  const rawBlock = match[2].trim();

  // ── Parse card blocks (split by ---)  ────────────────────────────────────
  const cardBlocks = rawBlock.split(/\n?---\n?/).map(b => b.trim()).filter(Boolean);

  const cards = cardBlocks.map(block => {
    // FRONT: everything after "FRONT:" up to "BACK:"
    const frontMatch = block.match(/FRONT:\s*([\s\S]+?)(?=\nBACK:|$)/i);
    // BACK: everything after "BACK:" to end of block
    const backMatch  = block.match(/BACK:\s*([\s\S]+?)$/i);

    return {
      front: frontMatch?.[1]?.trim() || "",
      back:  backMatch?.[1]?.trim()  || "",
    };
  }).filter(c => c.front && c.back);

  if (!cards.length) {
    // Still remove the raw block from display even if we couldn't parse cards
    return text
      .replace(/\[FLASHCARDS:[^\]]+\][\s\S]*?(?:\[\/FLASHCARDS\]|$)/, "")
      .trim();
  }

  // ── Save to backend ───────────────────────────────────────────────────────
  try {
    const fcRes  = await fetch(`${API_BASE}/flashcards/user-sets`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ name: setName, cards }),
    });
    const fcJson = await fcRes.json();
    if (fcJson.success) {
      setFlashcardSaved({ name: setName, count: cards.length, id: fcJson.data.id });
    }
  } catch (e) {
    console.error("Flashcard save error:", e);
  }

  // ── Replace the raw block in the displayed message ────────────────────────
  return text
    .replace(
      /\[FLASHCARDS:[^\]]+\][\s\S]*?(?:\[\/FLASHCARDS\]|(?=\n\n[^F])|$)/,
      `✅ **${cards.length} flashcards saved** to "${setName}"`
    )
    .trim();
}, [setFlashcardSaved]);

  // ── Build system prompt ───────────────────────────────────────────────────
  const buildSystemPrompt = useCallback(() => {
    let prompt = SYSTEM_PROMPT_BASE;
    const diary = buildDiaryContext(heatmapData, recentLogs);
    const muta  = buildMutashabihatContext(similarities);
    if (diary) prompt += `\n\n${diary}`;
    if (muta)  prompt += `\n\n${muta}`;
    if (!diary && !muta) {
      prompt += `\n\nNote: No diary or mutashabihat data available yet. Encourage the student to log entries first.`;
    }
    return prompt;
  }, [heatmapData, recentLogs, similarities]);

  // ── buildSimilarityContextForPrompt (PATCH Step 6) ───────────────────────
  const buildSimilarityContextForPrompt = useCallback((pairs) => {
    if (!pairs.length) return "";
    const lines = ["\n\n=== SIMILARITY DATA FOR TIP GENERATION ==="];
    lines.push("Use the [TIP:ID] format for each pair below. Include the exact ID shown.\n");

    const bySource = {};
    pairs.forEach((p) => {
      const key = `${p.sourceSurah}:${p.sourceAyah}`;
      if (!bySource[key]) bySource[key] = [];
      bySource[key].push(p);
    });

    Object.entries(bySource).forEach(([sourceKey, pairsForSource]) => {
      lines.push(`Source: Surah ${sourceKey}`);
      lines.push(`Found ${pairsForSource.length} similar pairs:`);
      pairsForSource.forEach((r) => {
        lines.push("");
        lines.push(`[ID:${r.id}] Surah ${r.name} (${r.target_surah}:${r.target_ayah})`);
        lines.push(`Marhala: ${r.marhala} | Juz: ${r.juz} | Strength: ${r.strength_label}`);
        lines.push(`Arabic text: ${r.text}`);
        const existingTips = Array.isArray(r.tips) ? r.tips : [];
        if (existingTips.length) lines.push(`Existing tips: ${existingTips.join("; ")}`);
      });
    });

    return lines.join("\n");
  }, []);

  // ── Send message (PATCH Step 5) ───────────────────────────────────────────
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || loading) return;

    if (!isUnlimited && remainingMessages === 0) {
      setError("You have used all 10 coach messages for today. Come back tomorrow! 📖");
      return;
    }

    // Auto-create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res  = await fetch(`${API_BASE}/coach/sessions`, {
          method: "POST", headers: getAuthHeader(),
          body: JSON.stringify({ title: userText.trim().slice(0, 50) }),
        });
        const json = await res.json();
        if (json.success) {
          sessionId = json.data.id;
          setActiveSessionId(sessionId);
          setSessions((prev) => [json.data, ...prev]);
        }
      } catch (e) { console.error("Auto-create session error:", e); return; }
    }

    if (!sessionId) { setError("Could not create session. Please try again."); return; }

    setError("");
    const now     = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const userMsg = { role: "user", content: userText.trim(), timestamp: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "44px";

    await saveMessage(sessionId, "user", userText.trim());

    const history     = [...messages, userMsg];
    const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));

    try {
      // 1. Detect intent and build Quran context
      const { context: quranContext, intent } = await buildQuranContext(userText);

      // 2. Fetch fresh similarity pairs for ALL mentioned ayahs
      let freshPairs = [];
      const isTipRequest = intent.wantsSimilar || /tip|mutasha/i.test(userText);

      if (isTipRequest && intent.allAyahPairs?.length > 0) {
        freshPairs = await fetchSimilarityForPairs(intent.allAyahPairs, intent.marhala);
      } else if (isTipRequest && intent.surahNum) {
        freshPairs = await fetchSimilarityForPairs(
          [{ surah: intent.surahNum, ayah: intent.ayahNum || 1 }],
          intent.marhala
        );
      }
      setLastSimilarityPairs(freshPairs);

      // 3. Build full system prompt with Quran data + similarity context
      const simContext = freshPairs.length > 0
        ? buildSimilarityContextForPrompt(freshPairs)
        : "";
      const fullSystem = buildSystemPrompt() + (quranContext || "") + simContext;

      // 4. Call AI
      const aiRes = await fetch(`${API_BASE}/coach/chat`, {
        method: "POST", headers: getAuthHeader(),
        body: JSON.stringify({ system: fullSystem, messages: apiMessages }),
      });

      if (!aiRes.ok) {
        const errJson = await aiRes.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `API error ${aiRes.status}`);
      }

      const aiData   = await aiRes.json();
      const rawReply = aiData.content?.map((b) => (b.type === "text" ? b.text : "")).join("") ||
        "Sorry, I could not generate a response.";

      // 5. Parse [TIP:id] blocks via parseTipsFromResponse (saves to DB internally)
      const { cleanedText, navPairs, count: tipCount } =
        await parseTipsFromResponse(rawReply, freshPairs);

      // 6. Parse and save flashcards
      const finalText = await parseAndSaveFlashcards(cleanedText);

      // 7. Strip any remaining [NAV:...] from displayed text
      let displayText = finalText;
      const navMatch  = finalText.match(/\[NAV:([^\]]+)\]/);
      if (navMatch) {
        displayText = finalText.replace(/\[NAV:[^\]]+\]\n?/g, "").trim();
      }

      const replyTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [...prev, { role: "assistant", content: displayText, timestamp: replyTime }]);
      await saveMessage(sessionId, "assistant", displayText);
      loadSessions();
      if (!isUnlimited) setRemainingMessages((prev) => Math.max(0, (prev ?? 10) - 1));

      // 8. Navigate to similarity page with tips if tips were generated
      if (tipCount > 0 && navPairs?.length > 0 && intent.allAyahPairs?.length > 0) {
        const coachTipsMap = {};
        navPairs.forEach((p) => {
          coachTipsMap[`${p.targetSurah}:${p.targetAyah}`] = p.tip;
        });
        const primary = intent.allAyahPairs[0];
        setNavigating(true);
        setTimeout(() => {
          setNavigating(false);
          navigate("/similarity", {
            state: {
              autoSearch: true,
              surah:      primary.surah,
              ayah:       primary.ayah,
              coachTips:  coachTipsMap,
            },
          });
        }, 1800);
      } else if (navMatch) {
        // Fallback: regular [NAV:] redirect
        setNavigating(true);
        setTimeout(() => {
          setNavigating(false);
          navigate(navMatch[1]);
        }, 1800);
      }

    } catch (err) {
      setError(err.message || "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    messages, loading, activeSessionId, isUnlimited, remainingMessages,
    buildSystemPrompt, buildSimilarityContextForPrompt,
    saveMessage, loadSessions,
    parseAndSaveFlashcards, parseTipsFromResponse,
    navigate,
  ]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const limitReached = !isUnlimited && remainingMessages === 0;
  const inputActive  = input.trim() && !loading && !limitReached;
  const weakCount    = heatmapData.filter((d) => d.score <= 5.75).length;
  const totalPages   = heatmapData.length;
  const simCount     = similarities.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100%", minHeight: 520, background: "white", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div style={{ width: 240, borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", background: "#FAFAFA", flexShrink: 0 }}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid #E5E7EB" }}>
            <button onClick={createSession}
              style={{ width: "100%", background: "#004D40", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <i className="ti ti-plus" style={{ fontSize: 14 }} /> New session
            </button>
          </div>

          {dataLoaded && (
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: 4 }}>
              {totalPages > 0 && (
                <span style={{ fontSize: 11, background: "#FEF3C7", color: "#92400E", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>
                  📖 {weakCount} weak / {totalPages} pages
                </span>
              )}
              <span style={{ fontSize: 11, background: "#EFF6FF", color: "#1D4ED8", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>
                🔗 {simCount > 0 ? `${simCount} similar pairs` : "No pairs loaded"}
              </span>
              {!isUnlimited && remainingMessages !== null && (
                <span style={{ fontSize: 11, background: remainingMessages <= 3 ? "#FEF2F2" : "#F0FDF4", color: remainingMessages <= 3 ? "#991B1B" : "#166534", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>
                  💬 {remainingMessages}/10 left today
                </span>
              )}
              {isUnlimited && (
                <span style={{ fontSize: 11, background: "#F0FDF4", color: "#166534", borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>
                  ✨ Unlimited access
                </span>
              )}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            {sessions.length === 0 && (
              <div style={{ padding: "20px 12px", fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
                No sessions yet.<br />Start a conversation!
              </div>
            )}
            {sessions.map((s) => (
              <div key={s.id}
                className={`ustadh-session-item ${activeSessionId === s.id ? "active" : ""}`}
                onClick={() => loadSession(s.id)}
                style={{ padding: "10px 12px", cursor: "pointer", borderLeft: "3px solid transparent", position: "relative", transition: "background .15s" }}>
                {renamingId === s.id ? (
                  <input autoFocus value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => saveRename(s.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveRename(s.id); if (e.key === "Escape") setRenamingId(null); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: "100%", fontSize: 12, border: "1px solid #004D40", borderRadius: 4, padding: "2px 6px", outline: "none" }} />
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: "#111827", fontWeight: activeSessionId === s.id ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 44 }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{timeAgo(s.updated_at)}</div>
                    <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 2 }}>
                      <button className="ustadh-del-btn"
                        onClick={(e) => { e.stopPropagation(); setRenamingId(s.id); setRenameValue(s.title); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", color: "#6B7280", fontSize: 12 }} title="Rename">
                        <i className="ti ti-pencil" />
                      </button>
                      <button className="ustadh-del-btn"
                        onClick={(e) => deleteSession(e, s.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", color: "#EF4444", fontSize: 12 }} title="Delete">
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main chat ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10, background: "white", flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen((v) => !v)}
            style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#6B7280", fontSize: 13 }} title="Toggle sidebar">
            <i className={`ti ${sidebarOpen ? "ti-layout-sidebar-left-collapse" : "ti-layout-sidebar-left-expand"}`} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#004D40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-star-filled" style={{ fontSize: 16, color: "#F2C94C" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Ustadh AI</div>
            <div style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: dataLoaded ? "#10B981" : "#F59E0B", display: "inline-block" }} />
              {dataLoaded ? "Ready · data loaded" : "Loading your data..."}
            </div>
          </div>
          {!isUnlimited && remainingMessages !== null && (
            <div style={{ marginLeft: 8, fontSize: 11, background: remainingMessages <= 3 ? "#FEF2F2" : "#F0FDF4", color: remainingMessages <= 3 ? "#991B1B" : "#166534", borderRadius: 20, padding: "2px 10px", fontWeight: 600 }}>
              💬 {remainingMessages}/10 left today
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px", display: "flex", flexDirection: "column" }}>

          {!activeSessionId && messages.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#004D40", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <i className="ti ti-star-filled" style={{ fontSize: 24, color: "#F2C94C" }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>Ustadh AI — Your Hifz Coach</h2>
              <p style={{ fontSize: 13, color: "#6B7280", maxWidth: 360, margin: "0 0 8px", lineHeight: 1.6 }}>
                I have access to your diary scores, mutashabihat data, and the full Quran. Mention any Surah, page, or Juz and I'll fetch the real data automatically.
              </p>

              {dataLoaded && (
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
                  {totalPages > 0 && (
                    <div style={{ fontSize: 12, background: "#F0FDF4", color: "#166534", borderRadius: 8, padding: "4px 12px", border: "1px solid #BBF7D0" }}>
                      📖 {totalPages} pages tracked · {weakCount} weak
                    </div>
                  )}
                  <div style={{ fontSize: 12, background: "#EFF6FF", color: "#1E40AF", borderRadius: 8, padding: "4px 12px", border: "1px solid #BFDBFE" }}>
                    🔗 {simCount > 0 ? `${simCount} similar pairs loaded` : "No pairs loaded yet"}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8, width: "100%", maxWidth: 500 }}>
                {SUGGESTED.map((s) => (
                  <button key={s.label} className="ustadh-suggest-btn"
                    onClick={() => sendMessage(s.prompt)}
                    style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: "#004D40", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#111827", lineHeight: 1.4 }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="ustadh-msg-enter">
              <MessageBubble msg={msg} />
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#004D40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <i className="ti ti-star-filled" style={{ fontSize: 16, color: "#F2C94C" }} />
              </div>
              <TypingIndicator />
            </div>
          )}

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 15 }} />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips */}
        {messages.length > 0 && messages.length % 4 === 0 && !loading && (
          <div style={{ padding: "8px 16px 4px", display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
            {["Which are my weakest pages?", "Which mutashabihat pairs should I focus on?", "Build me a revision schedule"].map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#6B7280", whiteSpace: "nowrap" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Navigation notice */}
        {navigating && (
          <div style={{ background: "#E6F4F1", border: "1px solid #004D40", borderRadius: 10, padding: "10px 16px", margin: "0 16px 8px", fontSize: 13, color: "#004D40", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-arrow-right" /> Opening Mutashabihat page and saving tips...
          </div>
        )}

        {/* Flashcard notice */}
        {flashcardSaved && (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: "10px 16px", margin: "0 16px 8px", fontSize: 13, color: "#166534", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span>✅ {flashcardSaved.count} flashcards saved to "{flashcardSaved.name}"</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => navigate("/flashcards")}
                style={{ background: "#004D40", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 12, padding: "4px 12px", borderRadius: 6 }}>
                View →
              </button>
              <button onClick={() => setFlashcardSaved(null)}
                style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>
                ×
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #F3F4F6", background: "white", flexShrink: 0 }}>
          {limitReached && (
            <div style={{ textAlign: "center", padding: "10px", fontSize: 13, color: "#991B1B", background: "#FEF2F2", borderRadius: 10, marginBottom: 10 }}>
              📖 Daily limit reached (10/10). Come back tomorrow!
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "#F9FAFB", borderRadius: 22, padding: "8px 8px 8px 16px", border: "1px solid #E5E7EB" }}>
            <textarea ref={textareaRef} className="ustadh-textarea" rows={1} value={input}
              onChange={handleTextareaInput} onKeyDown={handleKeyDown}
              placeholder={limitReached ? "Daily limit reached. Come back tomorrow." : "Ask about your Hifz journey… (mention Surah X:Y, page N, or Juz N)"}
              style={{ height: 44, maxHeight: 140, overflowY: "auto" }}
              disabled={loading || limitReached} />
            <button className="ustadh-send-btn" onClick={() => sendMessage(input)} disabled={!inputActive}
              style={{ width: 38, height: 38, borderRadius: "50%", background: inputActive ? "#004D40" : "#E5E7EB", border: "none", cursor: inputActive ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
              <i className="ti ti-arrow-up" style={{ fontSize: 17, color: inputActive ? "#fff" : "#9CA3AF" }} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", margin: "8px 0 0" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}