//C:\quran-similarity-app\frontend\src\shared\utils\scoreColors.js// Single source of truth for score thresholds used in forms AND analytics/heatmap.
// Thresholds: <= 5.75 = weak (red), <= 7.75 = ok (yellow), > 7.75 = strong (green)

export const scoreColor = (score) => {
    const s = Number(score);
    if (s <= 5.75) return '#DC2626';
    if (s <= 7.75) return '#EAB308';
    return '#16A34A';
};

export const scoreAccentColor = (score) => scoreColor(score);

export const scoreBgColor = (score) => {
    const s = Number(score);
    if (s <= 5.75) return '#FEE2E2';
    if (s <= 7.75) return '#FEF3C7';
    return '#D1FAE5';
};

export const scoreBorderColor = (score) => {
    const s = Number(score);
    if (s <= 5.75) return '#EF4444';
    if (s <= 7.75) return '#F59E0B';
    return '#10B981';
};

export const scoreLabel = (score) => {
    const s = Number(score);
    if (s <= 5.75) return 'Weak';
    if (s <= 7.75) return 'Ok';
    return 'Strong';
};