//C:\quran-similarity-app\backend\modules\coach\chat.routes.js
"use strict";

const express = require("express");
const router  = express.Router();
const auth    = require("../../middleware/authMiddleware");
const db      = require("../../config/database");
const COACH_SYSTEM_PROMPT = require("./coach.system-prompt");

const UNLIMITED_USER_ID = 2;
const DAILY_LIMIT       = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: daily message count for a user
// ─────────────────────────────────────────────────────────────────────────────
async function getDailyCount(userId) {
    const today = new Date().toISOString().split("T")[0];
    const row = await db.get(
        `SELECT COUNT(*) AS count
         FROM coach_messages
         WHERE user_id = ?
           AND DATE(created_at) = ?`,
        [userId, today]
    );
    return row?.count ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/coach/remaining
// ─────────────────────────────────────────────────────────────────────────────
router.get("/remaining", auth, async (req, res, next) => {
    try {
        const isUnlimited = Number(req.user.id) === UNLIMITED_USER_ID;
        if (isUnlimited) {
            return res.json({ success: true, data: { remaining: null, unlimited: true } });
        }
        const used = await getDailyCount(req.user.id);
        res.json({
            success: true,
            data: {
                remaining: Math.max(0, DAILY_LIMIT - used),
                unlimited: false,
            },
        });
    } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/coach/chat
// ─────────────────────────────────────────────────────────────────────────────
router.post("/chat", auth, async (req, res, next) => {
    try {
        const isUnlimited = Number(req.user.id) === UNLIMITED_USER_ID;

        // 1. Check daily limit
        if (!isUnlimited) {
            const used = await getDailyCount(req.user.id);
            if (used >= DAILY_LIMIT) {
                return res.status(429).json({
                    success: false,
                    error: `Daily limit of ${DAILY_LIMIT} coach messages reached. Come back tomorrow!`,
                });
            }
        }

        // 2. Validate Groq API key
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
        }

        // 3. Build messages
        const { messages = [], system: clientSystem } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "messages array is required and must not be empty." });
        }

        // Extract only the student data block from client system prompt
        const studentDataSection =
            clientSystem && clientSystem.includes("=== STUDENT")
                ? "\n\n" + clientSystem.substring(clientSystem.indexOf("=== STUDENT"))
                : clientSystem && clientSystem.includes("=== JUZ")
                ? "\n\n" + clientSystem.substring(clientSystem.indexOf("=== JUZ"))
                : "";

        const fullSystem = COACH_SYSTEM_PROMPT + studentDataSection;

        const formattedMessages = [
            { role: "system", content: fullSystem },
            ...messages.map((m) => ({
                role:    m.role === "assistant" ? "assistant" : "user",
                content: m.content,
            })),
        ];

        // 4. Call Groq
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model:       "llama-3.3-70b-versatile",
                messages:    formattedMessages,
                max_tokens:  1200,
                temperature: 0.7,
            }),
        });

        if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            console.error("Groq API error:", errText);
            if (groqResponse.status === 429) {
                return res.status(429).json({
                    error: "Rate limit reached. Please wait a moment and try again.",
                });
            }
            return res.status(groqResponse.status).json({ error: errText });
        }

        const groqData = await groqResponse.json();
        const text =
            groqData.choices?.[0]?.message?.content ||
            "Sorry, I could not generate a response.";

        // 5. Record usage (limited users only, on success)
        if (!isUnlimited) {
            await db
                .run("INSERT INTO coach_messages (user_id) VALUES (?)", [req.user.id])
                .catch((e) => console.error("Failed to record coach_message:", e.message));
        }

        // 6. Return Anthropic-compatible shape
        res.json({ content: [{ type: "text", text }] });

    } catch (err) {
        console.error("Coach proxy error:", err.message);
        next(err);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// SESSION CRUD
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/coach/sessions
router.get("/sessions", auth, async (req, res, next) => {
    try {
        const sessions = await db.all(
            `SELECT id, title, created_at, updated_at
             FROM chat_sessions
             WHERE user_id = ?
             ORDER BY updated_at DESC
             LIMIT 50`,
            [req.user.id]
        );
        res.json({ success: true, data: sessions });
    } catch (err) { next(err); }
});

// POST /api/coach/sessions
router.post("/sessions", auth, async (req, res, next) => {
    try {
        const { title } = req.body;
        const result = await db.run(
            "INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)",
            [req.user.id, (title || "New Session").trim().slice(0, 100)]
        );
        const session = await db.get(
            "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ?",
            [result.id]
        );
        res.status(201).json({ success: true, data: session });
    } catch (err) { next(err); }
});

// GET /api/coach/sessions/:id/messages
router.get("/sessions/:id/messages", auth, async (req, res, next) => {
    try {
        const session = await db.get(
            "SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found." });
        }
        const messages = await db.all(
            `SELECT id, role, content, created_at
             FROM chat_messages
             WHERE session_id = ?
             ORDER BY created_at ASC`,
            [req.params.id]
        );
        res.json({ success: true, data: messages });
    } catch (err) { next(err); }
});

// POST /api/coach/sessions/:id/messages
router.post("/sessions/:id/messages", auth, async (req, res, next) => {
    try {
        const { role, content } = req.body;
        if (!role || !content) {
            return res.status(400).json({ success: false, message: "role and content are required." });
        }
        if (!["user", "assistant"].includes(role)) {
            return res.status(400).json({ success: false, message: "role must be user or assistant." });
        }

        const session = await db.get(
            "SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found." });
        }

        const result = await db.run(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            [req.params.id, role, content]
        );

        // Update timestamp
        await db.run(
            "UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [req.params.id]
        );

        // Auto-title from first user message
        if (role === "user") {
            const msgCount = await db.get(
                "SELECT COUNT(*) AS count FROM chat_messages WHERE session_id = ? AND role = 'user'",
                [req.params.id]
            );
            if (msgCount.count === 1) {
                const autoTitle = content.trim().slice(0, 50) + (content.length > 50 ? "…" : "");
                await db.run(
                    "UPDATE chat_sessions SET title = ? WHERE id = ?",
                    [autoTitle, req.params.id]
                );
            }
        }

        res.status(201).json({ success: true, data: { id: result.id } });
    } catch (err) { next(err); }
});

// DELETE /api/coach/sessions/:id
router.delete("/sessions/:id", auth, async (req, res, next) => {
    try {
        const result = await db.run(
            "DELETE FROM chat_sessions WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: "Session not found." });
        }
        res.json({ success: true, message: "Session deleted." });
    } catch (err) { next(err); }
});

// PATCH /api/coach/sessions/:id
router.patch("/sessions/:id", auth, async (req, res, next) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ success: false, message: "title is required." });
        }
        const result = await db.run(
            "UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
            [title.trim().slice(0, 100), req.params.id, req.user.id]
        );
        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: "Session not found." });
        }
        res.json({ success: true, message: "Session renamed." });
    } catch (err) { next(err); }
});

module.exports = router;