// C:\quran-similarity-app\backend\modules\diary\juzzHali\juzzHali.service.js
const repo = require('../diary.repository');

exports.createJuzzHaliLogs = async (userId, entries, date) => {
    let count = 0;
    for (const entry of entries) {
        if (!entry.range_from || entry.score === undefined) continue;
        await repo.createLog(userId, 'juzz_hali', entry.range_from, "", Number(entry.score), entry.notes || "", date);
        count++;
    }
    return count;
};