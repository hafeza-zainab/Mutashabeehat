// ════════════════════════════════════════════════════════════════════
// FILE 1: frontend/src/features/coach/tipParser.js
// Parses [TIP:id] blocks from AI response, saves to DB, returns clean text
// ════════════════════════════════════════════════════════════════════

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/**
 * Parse [TIP:similarityId] blocks OR structured tip sections from AI text.
 *
 * The AI may output tips in several formats:
 *
 * Format A (preferred):
 *   [TIP:8265]
 *   Tip text here...
 *   [/TIP]
 *
 * Format B (fallback — numbered list with pair references):
 *   The AI describes tips inline referencing pair IDs from the similarity data.
 *
 * We also handle the case where NO [TIP] tags exist but the AI generated
 * tips for specific pairs — in that case we extract them and attach to the
 * correct similarity record using the pair data we passed in.
 */
export async function parseTipsFromResponse(text, similarityPairs) {
  const savedTips = []; // { similarityId, sourceSurah, sourceAyah, targetSurah, targetAyah, tip }
  let cleanedText = text;

  // ── Format A: explicit [TIP:id] ... [/TIP] blocks ──────────────────────────
  const tipBlockRegex = /\[TIP:(\d+)\]\s*([\s\S]*?)\[\/TIP\]/g;
  let match;
  while ((match = tipBlockRegex.exec(text)) !== null) {
    const similarityId = parseInt(match[1]);
    const tipText      = match[2].trim();

    // Find the pair this ID belongs to
    const pair = similarityPairs?.find(p => p.id === similarityId);
    if (pair && tipText) {
      savedTips.push({
        similarityId,
        sourceSurah:  pair.source_surah || pair.sourceSurah,
        sourceAyah:   pair.source_ayah  || pair.sourceAyah,
        targetSurah:  pair.target_surah,
        targetAyah:   pair.target_ayah,
        tip:          tipText,
      });
    }

    // Remove the raw block from display text
    cleanedText = cleanedText.replace(match[0], `💡 *Tip saved for pair ${similarityId}*`);
  }

  // ── Format B: [TIP:id] without closing tag (single-line) ───────────────────
  const singleTipRegex = /\[TIP:(\d+)\]\s*([^\[]+?)(?=\[TIP:|$)/gs;
  if (savedTips.length === 0) {
    let m2;
    while ((m2 = singleTipRegex.exec(text)) !== null) {
      const similarityId = parseInt(m2[1]);
      const tipText      = m2[2].trim();
      const pair         = similarityPairs?.find(p => p.id === similarityId);
      if (pair && tipText) {
        savedTips.push({
          similarityId,
          sourceSurah: pair.source_surah || pair.sourceSurah,
          sourceAyah:  pair.source_ayah  || pair.sourceAyah,
          targetSurah: pair.target_surah,
          targetAyah:  pair.target_ayah,
          tip:         tipText,
        });
      }
      cleanedText = cleanedText.replace(m2[0], `💡 *Tip saved for pair ${similarityId}*\n`);
    }
  }

  // ── Format C: AI produced tips in PAIRX: format (fallback) ─────────────────
  // e.g. "PAIR1: tip text\nPAIR2: tip text"
  if (savedTips.length === 0 && similarityPairs?.length > 0) {
    const pairLineRegex = /PAIR(\d+):\s*(.+?)(?=PAIR\d+:|$)/gs;
    let pm;
    while ((pm = pairLineRegex.exec(text)) !== null) {
      const idx  = parseInt(pm[1]) - 1; // PAIR1 = index 0
      const tip  = pm[2].trim();
      const pair = similarityPairs[idx];
      if (pair && tip) {
        savedTips.push({
          similarityId: pair.id,
          sourceSurah:  pair.source_surah || pair.sourceSurah,
          sourceAyah:   pair.source_ayah  || pair.sourceAyah,
          targetSurah:  pair.target_surah,
          targetAyah:   pair.target_ayah,
          tip,
        });
      }
    }
    if (savedTips.length > 0) {
      cleanedText = text.replace(/PAIR\d+:\s*.+?(?=PAIR\d+:|$)/gs, "").trim();
      cleanedText += `\n\n✅ ${savedTips.length} tip(s) saved to the Mutashabihat page.`;
    }
  }

  // ── Save all found tips to DB ────────────────────────────────────────────────
  const navPairs = []; // pairs we successfully saved tips for → navigate there
  for (const saved of savedTips) {
    try {
      // Fetch existing tips first
      const existingRes = await fetch(
        `${API_BASE}/similarity?surah=${saved.sourceSurah}&ayah=${saved.sourceAyah}`,
        { headers: getAuthHeader() }
      );
      const existingJson = await existingRes.json();
      const targetPair   = existingJson.data?.results?.find(
        r => r.target_surah === saved.targetSurah && r.target_ayah === saved.targetAyah
      );
      const existingTips = targetPair?.tips || [];
      const newTips      = Array.isArray(existingTips) ? existingTips : JSON.parse(existingTips || "[]");

      if (!newTips.includes(saved.tip)) {
        newTips.push(saved.tip);
      }

      await fetch(`${API_BASE}/similarity/tip`, {
        method:  "PUT",
        headers: getAuthHeader(),
        body:    JSON.stringify({
          source_surah: saved.sourceSurah,
          source_ayah:  saved.sourceAyah,
          target_surah: saved.targetSurah,
          target_ayah:  saved.targetAyah,
          tips:         newTips,
        }),
      });

      navPairs.push({
        sourceSurah: saved.sourceSurah,
        sourceAyah:  saved.sourceAyah,
        targetSurah: saved.targetSurah,
        targetAyah:  saved.targetAyah,
        tip:         saved.tip,
      });
    } catch (e) {
      console.error("Failed to save tip:", e);
    }
  }

  return { cleanedText, navPairs, count: savedTips.length };
}