//C:\quran-similarity-app\backend\server.js
require("dotenv").config();

// Validate required env vars before anything else
const REQUIRED_ENV = ["JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
}

const express      = require("express");
const cors         = require("cors");
const errorHandler = require("./middleware/errorHandler");

const authRoutes       = require("./modules/auth/auth.routes");
const ayahRoutes       = require("./modules/ayah/ayah.routes");
const similarityRoutes = require("./modules/similarity/similarity.routes");
const diaryRoutes      = require("./modules/diary/diary.routes");
const analyticsRoutes  = require("./modules/analytics/analytics.routes");
const taskRoutes       = require("./modules/tasks/task.routes");
const themeRoutes      = require("./modules/themes/theme.routes");

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => res.json({ status: "OK", timestamp: new Date().toISOString() }));

app.use("/api/auth",       authRoutes);
app.use("/api/ayah",       ayahRoutes);
app.use("/api/similarity", similarityRoutes);
app.use("/api/diary",      diaryRoutes);
app.use("/api/analytics",  analyticsRoutes);
app.use("/api/tasks",      taskRoutes);
app.use("/api/themes",     themeRoutes);

// ─── 404 handler ────────────────────────────────────────────────────────────

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ───────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`);
});