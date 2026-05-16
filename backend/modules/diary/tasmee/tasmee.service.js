const repo = require('../diary.repository');

exports.createTasmeeLogs = async (userId, entries, date) => {
    let count = 0;
    for (const entry of entries) {
        if (!entry.range_from || !entry.score) continue;
        await repo.createLog(userId, 'tasmee', entry.range_from, "", Number(entry.score), entry.notes || "", date);
        count++;
    }
    return count;
};