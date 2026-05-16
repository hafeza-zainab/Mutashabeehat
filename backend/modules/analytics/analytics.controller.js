const db = require('../../config/database');

exports.getTrend = async (req, res) => {
    try {
        const { range, start, end } = req.query;
        let startDate, endDate;
        endDate = new Date().toISOString().split('T')[0];

        if (start && end) {
            startDate = start;
            endDate = end;
        } else {
            const ranges = { '7d': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365, 'all': null };
            const days = (range in ranges) ? ranges[range] : 7;

            if (days === null) {
                // "All Time" fix: Fetch the actual earliest date for this user
                const firstEntry = await db.get(
                    `SELECT MIN(DATE(created_at)) as min_date FROM diary_logs WHERE user_id = ?`,
                    [req.user.id]
                );
                startDate = firstEntry?.min_date;
            } else {
                startDate = new Date(Date.now() - days * 86400000)
                    .toISOString()
                    .split('T')[0];
            }
        }

        // Fallback if user has no data at all
        if (!startDate) startDate = endDate;

        const dataSource = await db.all(
            `SELECT DATE(created_at) as raw_date, 
                    SUM(score) as total_score, 
                    COUNT(*) as total_entries
             FROM diary_logs
             WHERE user_id = ?
             AND DATE(created_at) BETWEEN ? AND ?
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at) ASC`,
            [req.user.id, startDate, endDate]
        );

        const chartData = dataSource.map(d => ({
            date: d.raw_date, // Keep ISO format for proper chart parsing
            percentage: Math.round((d.total_score / (d.total_entries * 10)) * 100)
        }));

        res.set('Cache-Control', 'no-store'); // Prevent browser caching issues
        res.json({ success: true, data: chartData });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getDeepDive = async (req, res) => {
    try {
        const { type, juzz, range } = req.query;
        
        const ranges = { '7d': '-7 days', '1m': '-1 month', '3m': '-3 months', '6m': '-6 months', '1y': '-1 year', 'all': '-100 years' };
        const interval = ranges[range] || '-7 days';
        
        let sql = `SELECT id, DATE(created_at) as log_date, range_from, range_to, score, notes 
                   FROM diary_logs 
                   WHERE user_id = ? AND type = ? AND created_at >= DATE('now', ?) 
                   ORDER BY created_at DESC`;
        let params = [req.user.id, type, interval];

        // Apply Juzz filter for types that support it
        if ((type === 'murajah' || type === 'tasmee' || type === 'juzz_hali') && juzz) {
            sql += ` AND range_from LIKE ?`;
            params.push(`%Juzz ${juzz}%`);
        }

        const data = await db.all(sql, params);
        res.json({ success: true, data: data || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getHeatmapData = async (req, res) => {
    try {
        const logs = await db.all(
            `SELECT range_from, score, notes 
             FROM diary_logs 
             WHERE user_id = ? AND type IN ('murajah', 'tasmee', 'ikhtebar', 'jadeed', 'juzz_hali')`,
            [req.user.id]
        );

        const parsedData = [];

        for (const log of logs) {
            const str = log.range_from || "";

            // 1. Jadeed: "Jadeed - Juzz 5 - Pages 102 to 105" -> Expand to individual pages for the heatmap
            const jadeedMatch = str.match(/Jadeed.*?Juzz\s+(\d+).*?Pages?\s+(\d+)\s+to\s+(\d+)/i);
            if (jadeedMatch) {
                const juzz = parseInt(jadeedMatch[1]);
                const startPage = parseInt(jadeedMatch[2]);
                const endPage = parseInt(jadeedMatch[3]);
                for (let p = startPage; p <= endPage; p++) {
                    parsedData.push({ juzz, page: p, score: log.score, notes: log.notes });
                }
                continue;
            }

            // 2. All others (Murajah, Tasmee, Ikhtebar, Juzz Hali): "Juzz 5 - ... Page/Pg 102"
            const match = str.match(/Juzz\s+(\d+).*?(?:Page|Pg)\s*(\d+)/i);
            if (match) {
                parsedData.push({
                    juzz: parseInt(match[1]),
                    page: parseInt(match[2]),
                    score: log.score,
                    notes: log.notes
                });
                continue;
            }
        }

        res.json({ success: true, data: parsedData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};