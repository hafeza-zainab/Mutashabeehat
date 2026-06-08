// C:\quran-similarity-app\frontend\src\features\coach\quranContextBuilder.js
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── Intent detection ─────────────────────────────────────────────────────────
export function detectIntent(text) {
  const t = text.toLowerCase();

  // Page: "page 582", "pg 100", "page number 582"
  const pageMatch = text.match(/\b(?:page|pg\.?)\s*(?:number\s*)?(\d{1,3})\b/i);

  // Surah number: "surah 112", "surah al-ikhlas (112)", "(112)"
  const surahNumMatch =
    text.match(/\bsurah\s+(\d{1,3})\b/i) ||
    text.match(/\bsurah\s+[\w-]+\s*\((\d{1,3})\)/i) ||
    text.match(/\((\d{1,3})\)/);

  // Ayah alongside surah: "27:62", "surah 27 ayah 62"
  const ayahMatch =
    text.match(/\b(\d{1,3})\s*[:/]\s*(\d{1,3})\b/) ||
    text.match(/surah\s*(\d{1,3})\s*ayah\s*(\d{1,3})/i);

  // Juz: "juz 20", "para 20", "sipara 20"
  const juzMatch = text.match(/\b(?:juz|juzz|para|sipara|siparah)\s*(\d{1,2})\b/i);

  // Marhala: capture the full "marhala X" phrase but return only the word after
  const marhalaMatch = text.match(/marhala\s+(\w+)/i);

  // All ayah pairs mentioned: "2:255 and 2:256", multiple references
  const allAyahPairs = [];
  const ayahRegex = /\b(\d{1,3})\s*[:/]\s*(\d{1,3})\b/g;
  let am;
  while ((am = ayahRegex.exec(text)) !== null) {
    allAyahPairs.push({ surah: parseInt(am[1]), ayah: parseInt(am[2]) });
  }

  // Intent keywords
  const wantsFlashcards = /flashcard|flash card/i.test(t);
  const wantsSequence   = /sequence|order|arrange|flow|chain|first word/i.test(t);
  // Include "tip|mutasha" so tip requests trigger similarity fetches
  const wantsSimilar    = /similar|mutasha|confus|mix|same|like|tip.*remember|remember.*tip/i.test(t);
  const wantsSchedule   = /schedule|plan|daily|routine|when|time/i.test(t);
  const wantsWeak       = /weak|struggle|difficult|hard|forget|revise|revision/i.test(t);

  return {
    pageNum:  pageMatch    ? parseInt(pageMatch[1])                                          : null,
    surahNum: surahNumMatch ? parseInt(surahNumMatch[surahNumMatch.length - 1])              : null,
    ayahNum:  ayahMatch    ? parseInt(ayahMatch[2])                                          : null,
    juzNum:   juzMatch     ? parseInt(juzMatch[1])                                           : null,
    marhala:  marhalaMatch ? marhalaMatch[1]                                                 : null,
    // Fall back to the single ayahMatch pair if no explicit X:Y pairs were found
    allAyahPairs: allAyahPairs.length > 0
      ? allAyahPairs
      : (ayahMatch ? [{ surah: parseInt(ayahMatch[1]), ayah: parseInt(ayahMatch[2]) }] : []),
    wantsFlashcards,
    wantsSequence,
    wantsSimilar,
    wantsSchedule,
    wantsWeak,
  };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchPageData(pageNum) {
  try {
    const res  = await fetch(`${API_BASE}/ayah/page/${pageNum}/full`, { headers: getAuthHeader() });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

async function fetchSurahData(surahNum) {
  try {
    const res  = await fetch(`${API_BASE}/ayah/${surahNum}/full`, { headers: getAuthHeader() });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

async function fetchJuzData(juzNum) {
  try {
    const res  = await fetch(`${API_BASE}/ayah/juz/${juzNum}/full`, { headers: getAuthHeader() });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

async function fetchSimilarityData(surah, ayah, marhala) {
  try {
    let url = `${API_BASE}/similarity?surah=${surah}&ayah=${ayah}`;
    if (marhala) url += `&marhala=${encodeURIComponent(marhala)}`;
    const res  = await fetch(url, { headers: getAuthHeader() });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

// ─── Context formatters ───────────────────────────────────────────────────────
function formatPageContext(data) {
  if (!data) return "";
  const lines = [
    `=== PAGE ${data.page} DATA ===`,
    `Juz: ${data.juz} | Marhala: ${data.marhala} | Total ayahs on this page: ${data.totalAyahs}`,
    `First ayah: ${data.firstAyah.name} (${data.firstAyah.surah}:${data.firstAyah.ayah})`,
    `Last ayah:  ${data.lastAyah.name} (${data.lastAyah.surah}:${data.lastAyah.ayah})`,
    ``,
    `IMPORTANT: When creating flashcards for this page, use ONLY the Arabic text below as BACK values.`,
    `NEVER use "Surah X:Y" as a flashcard back — use the actual Arabic text.`,
    ``,
  ];

  data.surahs.forEach(s => {
    lines.push(`--- Surah ${s.name} (${s.surah}) on this page ---`);
    s.ayahs.forEach(a => {
      lines.push(`Ayah ${a.ayah}: ${a.text}`);
      lines.push(`  First word: ${a.firstWord}`);
    });
    lines.push("");
  });

  lines.push(`FLASHCARD TEMPLATE FOR PAGE ${data.page} SEQUENCE:`);
  lines.push(`Create one card per ayah. FRONT = "What is Ayah N of Surah X on Page ${data.page}?", BACK = exact Arabic text above.`);
  return lines.join("\n");
}

function formatSurahContext(data) {
  if (!data) return "";
  const lines = [
    `=== SURAH ${data.name} (${data.surah}) DATA ===`,
    `Juz: ${data.juz} | Marhala: ${data.marhala} | Starting page: ${data.page} | Total ayahs: ${data.totalAyahs}`,
    ``,
    `IMPORTANT: Use the EXACT Arabic text below as BACK values for flashcards.`,
    `NEVER use "Surah X:Y" as a flashcard back — use the actual Arabic text.`,
    ``,
    `AYAH LIST:`,
  ];

  data.ayahs.forEach(a => {
    lines.push(`Ayah ${a.ayah} (Page ${a.page}):`);
    lines.push(`  Arabic text: ${a.text}`);
    lines.push(`  First word:  ${a.firstWord}`);
  });

  lines.push("");
  lines.push(`FIRST WORDS SEQUENCE (for sequence memory aid):`);
  lines.push(data.ayahs.map(a => `Ayah ${a.ayah}: ${a.firstWord}`).join(" | "));
  lines.push("");
  lines.push(`FLASHCARD TEMPLATE FOR SURAH ${data.name} SEQUENCE:`);
  lines.push(`Create one card per ayah. FRONT = "What is Ayah N of ${data.name}?", BACK = exact Arabic text above.`);
  return lines.join("\n");
}

function formatSimilarityContext(data, surah, ayah) {
  if (!data || !data.results?.length) {
    return `=== SIMILARITY DATA FOR ${surah}:${ayah} ===\nNo similarity pairs found for this ayah.`;
  }
  const lines = [
    `=== SIMILARITY DATA FOR ${surah}:${ayah} ===`,
    `Source: ${data.source?.name} (${surah}:${ayah})`,
    `Found ${data.results.length} similar pairs:`,
    "",
  ];
  data.results.forEach(r => {
    lines.push(`[ID:${r.id}] Surah ${r.name} (${r.target_surah}:${r.target_ayah}) — ${Math.round(r.similarity_score * 100)}% ${r.strength_label}`);
    lines.push(`  Marhala: ${r.marhala} | Juz: ${r.juz}`);
    lines.push(`  Arabic text: ${r.text}`);
    if (r.tips?.length) lines.push(`  Existing tips: ${r.tips.join("; ")}`);
    lines.push("");
  });
  return lines.join("\n");
}

function formatJuzContext(data) {
  if (!data) return "";
  const lines = [
    `=== JUZ ${data.juz} DATA ===`,
    `Marhala: ${data.marhala} | Total ayahs: ${data.totalAyahs}`,
    `Pages: ${data.pages.join(", ")}`,
    ``,
    `Surahs in this Juz:`,
  ];
  data.entries.forEach(e => {
    lines.push(`  Surah ${e.name} (${e.surah}) — starts Page ${e.page} — ${e.ayah_count} ayahs`);
  });
  return lines.join("\n");
}

// ─── Main builder — call before every AI request ─────────────────────────────
export async function buildQuranContext(userText) {
  const intent   = detectIntent(userText);
  const sections = [];
  const fetches  = [];

  // ── Page data ──────────────────────────────────────────────────────────────
  if (intent.pageNum && intent.pageNum >= 1 && intent.pageNum <= 604) {
    fetches.push(
      fetchPageData(intent.pageNum).then(data => {
        if (data) sections.push(formatPageContext(data));
      })
    );
  }

  // ── Surah data (flashcards, sequence, or any general surah mention) ─────────
  if (intent.surahNum && intent.surahNum >= 1 && intent.surahNum <= 114) {
    fetches.push(
      fetchSurahData(intent.surahNum).then(data => {
        if (data) sections.push(formatSurahContext(data));
      })
    );
  }

  // ── Surah data for every unique surah in allAyahPairs (flashcard requests) ──
  if (intent.wantsFlashcards && intent.allAyahPairs.length > 0) {
    const uniqueSurahs = [...new Set(intent.allAyahPairs.map(p => p.surah))]
      .filter(s => s !== intent.surahNum && s >= 1 && s <= 114); // avoid double-fetch
    for (const s of uniqueSurahs) {
      fetches.push(
        fetchSurahData(s).then(data => {
          if (data) sections.push(formatSurahContext(data));
        })
      );
    }
  }

  // ── Similarity data — fetch for ALL mentioned ayah pairs ───────────────────
  if (intent.wantsSimilar) {
    if (intent.allAyahPairs.length > 0) {
      for (const pair of intent.allAyahPairs) {
        if (pair.surah >= 1 && pair.surah <= 114) {
          fetches.push(
            fetchSimilarityData(pair.surah, pair.ayah, intent.marhala).then(data => {
              if (data) sections.push(formatSimilarityContext(data, pair.surah, pair.ayah));
            })
          );
        }
      }
    } else if (intent.surahNum) {
      // Single surah mentioned without explicit X:Y — use ayah 1 as fallback
      const ayah = intent.ayahNum || 1;
      fetches.push(
        fetchSimilarityData(intent.surahNum, ayah, intent.marhala).then(data => {
          if (data) sections.push(formatSimilarityContext(data, intent.surahNum, ayah));
        })
      );
    }
  }

  // ── Juz data ───────────────────────────────────────────────────────────────
  if (intent.juzNum && intent.juzNum >= 1 && intent.juzNum <= 30) {
    fetches.push(
      fetchJuzData(intent.juzNum).then(data => {
        if (data) sections.push(formatJuzContext(data));
      })
    );
  }

  // Run all fetches in parallel
  await Promise.all(fetches);

  return { context: sections.join("\n\n"), intent };
}