// C:\quran-similarity-app\backend\modules\diary\murajah\murajah.service.js
const repo = require('../diary.repository');

exports.createMurajahLogs = async (userId, entries, date) => {
    let count = 0;
    for (const entry of entries) {
        // FIXED: Check for null/undefined, not falsy (so score of 0 is allowed)
        if (!entry.range_from || entry.score == null) continue;
        await repo.createLog(userId, 'murajah', entry.range_from, entry.range_to || "", Number(entry.score), entry.notes || '', date);
        count++;
    }
    return count;
};