// C:\quran-similarity-app\frontend\src\shared\utils\themeRegistry.js

const seededRandom = (seed) => {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
};

const generateParticles = (streak, w, h, color, seed, max = 60) => {
    const count = Math.min(Math.max(streak * 2, 0), max);
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const s = seed + i * 31;
        const x = seededRandom(s) * w;
        const y = seededRandom(s + 500) * h;
        const size = seededRandom(s + 1000) > 0.85 ? 2 : 1;
        const alpha = (0.3 + seededRandom(s + 2000) * 0.7).toFixed(2);
        shadows.push(`${x}px ${y}px 0 ${size}px rgba(${color},${alpha})`);
    }
    return shadows.join(', ');
};

const THEMES = {
    forest: {
        id: 'forest', name: 'Forest of Consistency', icon: '🌳',
        tagline: 'Consistency creates life.',
        particle: '120,200,80',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '🌱' }, { days: 7, emoji: '🌿' },
            { days: 14, emoji: '🌳' }, { days: 30, emoji: '🌲' }, { days: 60, emoji: '🍄' },
            { days: 100, emoji: '🦋' }, { days: 200, emoji: '🦌' }, { days: 365, emoji: '🏔️' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#3d2817,#2a1d10)';
            if (s <= 6) return 'linear-gradient(180deg,#2a3d17,#1d2a10)';
            if (s <= 13) return 'linear-gradient(180deg,#1a3d1a,#0d2a0d)';
            return 'linear-gradient(180deg,#0d3d0d,#052505)';
        },
        bar: 'rgba(10,30,10,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '120,200,80', 0)
    },

    house: {
        id: 'house', name: 'House Brick-by-Brick', icon: '🏠',
        tagline: 'Small deeds build a meaningful life.',
        particle: '220,180,120',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '🧱' }, { days: 7, emoji: '🪟' },
            { days: 14, emoji: '🏠' }, { days: 30, emoji: '🏮' }, { days: 60, emoji: '📚' },
            { days: 100, emoji: '🛋️' }, { days: 200, emoji: '🏡' }, { days: 365, emoji: '🏰' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#4a3728,#3d2d1e)';
            if (s <= 6) return 'linear-gradient(180deg,#5a4230,#4a3728)';
            if (s <= 13) return 'linear-gradient(180deg,#6a5040,#5a4230)';
            return 'linear-gradient(180deg,#7a6050,#6a5040)';
        },
        bar: 'rgba(40,25,10,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '220,180,120', 100)
    },

    sky: {
        id: 'sky', name: 'Celestial Sky', icon: '🌙',
        tagline: 'Every act lights the heavens.',
        particle: '255,255,255',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '✨' }, { days: 7, emoji: '🌙' },
            { days: 14, emoji: '⭐' }, { days: 30, emoji: '🏮' }, { days: 60, emoji: '🌌' },
            { days: 100, emoji: '🔭' }, { days: 200, emoji: '🌈' }, { days: 365, emoji: '💫' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#06060e,#0c0c18)';
            if (s <= 6) return 'linear-gradient(180deg,#0e0e2a,#181840)';
            if (s <= 13) return 'linear-gradient(180deg,#101530,#1a2248)';
            return 'linear-gradient(135deg,#1a2a55,#241848)';
        },
        bar: 'rgba(10,10,20,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '255,255,255', 0, 80)
    },

    lanterns: {
        id: 'lanterns', name: 'Lanterns of Guidance', icon: '🏮',
        tagline: 'Light overcomes darkness.',
        particle: '255,180,50',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '🕯️' }, { days: 7, emoji: '🏮' },
            { days: 14, emoji: '✨' }, { days: 30, emoji: '🕌' }, { days: 60, emoji: '🌙' },
            { days: 100, emoji: '⭐' }, { days: 200, emoji: '🏙️' }, { days: 365, emoji: '🕋' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#1a0f05,#120a03)';
            if (s <= 6) return 'linear-gradient(180deg,#2a1808,#1a0f05)';
            if (s <= 13) return 'linear-gradient(180deg,#3d2210,#2a1808)';
            return 'linear-gradient(180deg,#4d2c15,#3d2210)';
        },
        bar: 'rgba(20,10,0,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '255,180,50', 200)
    },

    garden: {
        id: 'garden', name: 'Garden of Deeds', icon: '🌸',
        tagline: 'Good actions cultivate a spiritual garden.',
        particle: '255,150,200',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '🌱' }, { days: 7, emoji: '🌸' },
            { days: 14, emoji: '🌺' }, { days: 30, emoji: '🌻' }, { days: 60, emoji: '🦋' },
            { days: 100, emoji: '⛲' }, { days: 200, emoji: '🕊️' }, { days: 365, emoji: '🌈' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#3d2817,#2a1d10)';
            if (s <= 6) return 'linear-gradient(180deg,#2d3d17,#1d2a10)';
            if (s <= 13) return 'linear-gradient(180deg,#1d3d2d,#0d2a1d)';
            return 'linear-gradient(180deg,#153d25,#0d2a15)';
        },
        bar: 'rgba(15,30,15,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '255,150,200', 300)
    },

    library: {
        id: 'library', name: 'Library of Knowledge', icon: '📚',
        tagline: 'Knowledge accumulates into a grand library.',
        particle: '218,165,32',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '📖' }, { days: 7, emoji: '📚' },
            { days: 14, emoji: '🕯️' }, { days: 30, emoji: '🏛️' }, { days: 60, emoji: '🔍' },
            { days: 100, emoji: '⭐' }, { days: 200, emoji: '🌟' }, { days: 365, emoji: '💫' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#2a1a0a,#1d1208)';
            if (s <= 6) return 'linear-gradient(180deg,#3d2a15,#2a1a0a)';
            if (s <= 13) return 'linear-gradient(180deg,#4d3520,#3d2a15)';
            return 'linear-gradient(180deg,#5d4030,#4d3520)';
        },
        bar: 'rgba(25,15,5,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '218,165,32', 400)
    },

    mountain: {
        id: 'mountain', name: 'Mountain Journey', icon: '⛰️',
        tagline: 'Consistency is a climb toward higher ground.',
        particle: '200,220,255',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '🥾' }, { days: 7, emoji: '⛰️' },
            { days: 14, emoji: '🏕️' }, { days: 30, emoji: '🏔️' }, { days: 60, emoji: '☁️' },
            { days: 100, emoji: '🌊' }, { days: 200, emoji: '❄️' }, { days: 365, emoji: '🌅' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#2a2a30,#1d1d22)';
            if (s <= 6) return 'linear-gradient(180deg,#252535,#1a1a28)';
            if (s <= 13) return 'linear-gradient(180deg,#202540,#151830)';
            return 'linear-gradient(180deg,#182050,#101540)';
        },
        bar: 'rgba(15,15,25,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '200,220,255', 500)
    },

    oasis: {
        id: 'oasis', name: 'Oasis from the Desert', icon: '🏜️',
        tagline: 'Consistency transforms emptiness into life.',
        particle: '100,200,220',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '💧' }, { days: 7, emoji: '🌴' },
            { days: 14, emoji: '💧' }, { days: 30, emoji: '🏖️' }, { days: 60, emoji: '⛺' },
            { days: 100, emoji: '🏰' }, { days: 200, emoji: '河流' }, { days: 365, emoji: '🌆' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#c2a060,#a08040)';
            if (s <= 6) return 'linear-gradient(180deg,#a0a050,#808030)';
            if (s <= 13) return 'linear-gradient(180deg,#60a080,#408060)';
            return 'linear-gradient(180deg,#40a0a0,#208080)';
        },
        bar: 'rgba(40,30,10,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '100,200,220', 600)
    },

    ship: {
        id: 'ship', name: 'Ship Across the Sea', icon: '⛵',
        tagline: 'Each day advances a voyage.',
        particle: '150,200,255',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '⛵' }, { days: 7, emoji: '⚓' },
            { days: 14, emoji: '🏝️' }, { days: 30, emoji: '🧭' }, { days: 60, emoji: '🗺️' },
            { days: 100, emoji: '🏴‍☠️' }, { days: 200, emoji: '🌊' }, { days: 365, emoji: '🌅' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#0a1520,#061018)';
            if (s <= 6) return 'linear-gradient(180deg,#0e2040,#0a1830)';
            if (s <= 13) return 'linear-gradient(180deg,#102a50,#0c2040)';
            return 'linear-gradient(180deg,#153060,#102850)';
        },
        bar: 'rgba(5,10,20,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '150,200,255', 700)
    },

    city: {
        id: 'city', name: 'City Builder', icon: '🏙️',
        tagline: 'Daily discipline builds a civilization.',
        particle: '255,200,100',
        milestones: [
            { days: 0, emoji: '🌑' }, { days: 3, emoji: '🏗️' }, { days: 7, emoji: '🏠' },
            { days: 14, emoji: '🕌' }, { days: 30, emoji: '🏫' }, { days: 60, emoji: '🏥' },
            { days: 100, emoji: '🌃' }, { days: 200, emoji: '🌆' }, { days: 365, emoji: '✨' }
        ],
        bg: (s) => {
            if (s === 0) return 'linear-gradient(180deg,#1a1a25,#121218)';
            if (s <= 6) return 'linear-gradient(180deg,#1e1e30,#161625)';
            if (s <= 13) return 'linear-gradient(180deg,#222240,#1a1a35)';
            return 'linear-gradient(180deg,#282850,#202045)';
        },
        bar: 'rgba(12,12,20,0.92)',
        particles: (s) => generateParticles(s, 900, 120, '255,200,100', 800)
    }
};

export const THEME_LIST = Object.values(THEMES);

export const getTheme = (id) => THEMES[id] || THEMES.sky;

export const getCurrentMilestone = (theme, streak) => {
    let current = theme.milestones[0];
    for (const m of theme.milestones) {
        if (streak >= m.days) current = m;
    }
    return current;
};

export const getNextMilestone = (theme, streak) => {
    for (const m of theme.milestones) {
        if (streak < m.days) return m;
    }
    return null;
};