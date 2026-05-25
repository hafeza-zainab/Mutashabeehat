// C:\quran-similarity-app\backend\modules\analytics\analytics.controller.js
// Fix #12: added LIMIT 500 to getDeepDive query to prevent unbounded result sets.
// Also fixed getDeepDive to handle 'Juz_Hali' type correctly (was stored as 'Juz_Hali').

const db = require('../../config/database');

// ─── helpers ────────────────────────────────────────────────────────────────

const RANGE_INTERVALS = {
    '7d':  7,
    '1m':  30,
    '3m':  90,
    '6m':  180,
    '1y':  365,
    'all': 365 * 10,
};

const DEEP_DIVE_INTERVALS = {
    '7d':  '-7 days',
    '1m':  '-1 month',
    '3m':  '-3 months',
    '6m':  '-6 months',
    '1y':  '-1 year',
    'all': '-100 years',
};

// Map frontend type values to the exact DB stored values
const TYPE_MAP = {
    murajah:  'murajah',
    tasmee:   'tasmee',
    ikhtebar: 'ikhtebar',
    jadeed:   'jadeed',
    juzz_hali: 'Juz_Hali',
    Juz_Hali: 'Juz_Hali',
};

function toDateStr(date) {
    return date.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return toDateStr(d);
}

// ─── controllers ────────────────────────────────────────────────────────────

exports.getTrend = async (req, res, next) => {
    try {
        const { range, start, end } = req.query;
        const today = toDateStr(new Date());

        let startDate, endDate;

        if (start && end) {
            startDate = start < end ? start : end;
            endDate   = start < end ? end   : start;
        } else {
            const days = RANGE_INTERVALS[range] ?? 7;
            startDate  = toDateStr(new Date(Date.now() - days * 86400000));
            endDate    = today;
        }

        const rows = await db.all(
            `SELECT DATE(created_at) AS raw_date,
                    SUM(score)       AS total_score,
                    COUNT(id)        AS total_entries
             FROM diary_logs
             WHERE user_id = ?
               AND DATE(created_at) >= ?
               AND DATE(created_at) <= ?
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at) ASC`,
            [req.user.id, startDate, endDate]
        );

        const dataMap = new Map(
            rows.map((d) => [
                d.raw_date,
                d.total_entries > 0
                    ? Math.round((d.total_score / (d.total_entries * 10)) * 100)
                    : 0,
            ])
        );

        // Fill every date in range (null for days with no entries — frontend
        // should NOT use connectNulls so gaps are visible)
        const continuousData = [];
        let cursor = startDate;
        while (cursor <= endDate) {
            continuousData.push({
                date:       cursor,
                percentage: dataMap.get(cursor) ?? null,
            });
            cursor = addDays(cursor, 1);
        }

        res.status(200).json({ success: true, data: continuousData });
    } catch (err) {
        next(err);
    }
};

exports.getDeepDive = async (req, res, next) => {
    try {
        const { type, juz, range } = req.query;

        if (!type) {
            return res.status(400).json({ success: false, message: 'type query param is required.' });
        }

        // Fix #12: map frontend type value to exact DB stored value
        const dbType = TYPE_MAP[type];
        if (!dbType) {
            return res.status(400).json({ success: false, message: `Unknown type: ${type}` });
        }

        const interval = DEEP_DIVE_INTERVALS[range] ?? '-7 days';

        let sql = `
            SELECT id, DATE(created_at) AS log_date, range_from, range_to, score
            FROM diary_logs
            WHERE user_id = ?
              AND type = ?
              AND created_at >= DATE('now', ?)`;

        const params = [req.user.id, dbType, interval];

        // Juz filter for murajah and tasmee
        if ((dbType === 'murajah' || dbType === 'tasmee') && juz) {
            sql += ' AND range_from LIKE ?';
            params.push(`Juz ${juz}%`);
        }

        // Fix #12: hard limit — never return unbounded rows to the frontend
        sql += ' ORDER BY created_at DESC LIMIT 500';

        const data = await db.all(sql, params);
        res.status(200).json({ success: true, data: data ?? [] });
    } catch (err) {
        next(err);
    }
};

exports.getHeatmapData = async (req, res, next) => {
    try {
        const logs = await db.all(
            `SELECT range_from, score
             FROM diary_logs
             WHERE user_id = ?
               AND type IN ('murajah', 'tasmee', 'ikhtebar', 'Juz_Hali')`,
            [req.user.id]
        );

        // Parse "Juz N - Page M" format stored by the import scripts
        const data = logs
            .map((log) => {
                const juzMatch  = log.range_from?.match(/Juz\s*(\d+)/i);
                const pageMatch = log.range_from?.match(/Page\s*(\d+)/i);
                if (!juzMatch || !pageMatch) return null;
                return {
                    juz:   parseInt(juzMatch[1]),
                    page:  parseInt(pageMatch[1]),
                    score: log.score,
                };
            })
            .filter(Boolean);

        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};