// C:\quran-similarity-app\frontend\src\shared\utils\themeRegistry.js
const THEME_REGISTRY = {
    sky: {
        id: 'sky',
        name: 'Celestial Sky',
        icon: '🌌',
        tagline: 'Every act lights the heavens.',
        milestones: [
            { days: 0,   emoji: '🌑', label: 'New Moon' },
            { days: 7,   emoji: '🌒', label: 'Moonrise' },
            { days: 14,  emoji: '🌓', label: 'First Quarter' },
            { days: 30,  emoji: '🌕', label: 'Full Illumination' },
            { days: 100, emoji: '⭐', label: 'Star Navigator' },
            { days: 365, emoji: '✨', label: 'Celestial Being' }
        ]
    },
    forest: {
        id: 'forest',
        name: 'Forest of Consistency',
        icon: '🌲',
        tagline: 'Roots grow deep through patience.',
        milestones: [
            { days: 0,   emoji: '🌱', label: 'Seedling' },
            { days: 7,   emoji: '🌿', label: 'First Leaves' },
            { days: 21,  emoji: '🍃', label: 'Growing Strong' },
            { days: 60,  emoji: '🌳', label: 'Deep Roots' },
            { days: 180, emoji: '🍄', label: 'Forest Dweller' },
            { days: 365, emoji: '🏔️', label: 'Ancient Grove' }
        ]
    },
    mountain: {
        id: 'mountain',
        name: 'Mountain of Resolve',
        icon: '⛰️',
        tagline: 'The climb is hard but the view is worth it.',
        milestones: [
            { days: 0,   emoji: '🥾', label: 'Base Camp' },
            { days: 7,   emoji: '⛰️', label: 'First Ascent' },
            { days: 30,  emoji: '🏔️', label: 'Tree Line' },
            { days: 100, emoji: '❄️',  label: 'Snow Peak' },
            { days: 200, emoji: '🧗', label: 'Near Summit' },
            { days: 365, emoji: '🌅', label: 'Summit Reached' }
        ]
    },
    oasis: {
        id: 'oasis',
        name: 'Desert Oasis',
        icon: '🌴',
        tagline: 'In the desert of forgetfulness, water is found.',
        milestones: [
            { days: 0,   emoji: '🏜️', label: 'Desert Start' },
            { days: 7,   emoji: '🌵', label: 'First Palm' },
            { days: 30,  emoji: '💧', label: 'Water Found' },
            { days: 100, emoji: '🌴', label: 'Oasis Rest' },
            { days: 200, emoji: '🐚', label: 'Desert Pearl' },
            { days: 365, emoji: '🟢', label: 'Paradise Oasis' }
        ]
    },
    ship: {
        id: 'ship',
        name: 'Voyage of Memorization',
        icon: '⛵',
        tagline: 'Sail across the ocean of Quran.',
        milestones: [
            { days: 0,   emoji: '⚓', label: 'Harbor Start' },
            { days: 7,   emoji: '⛵', label: 'Setting Sail' },
            { days: 30,  emoji: '🌊', label: 'Open Waters' },
            { days: 100, emoji: '🧭', label: 'Navigating Well' },
            { days: 200, emoji: '🗺️', label: 'Charting Course' },
            { days: 365, emoji: '🏝️', label: 'Destination Reached' }
        ]
    }
};

export const getTheme = (themeId) =>
    THEME_REGISTRY[themeId] || THEME_REGISTRY.sky;

export const getCurrentMilestone = (themeId, streak) => {
    const theme = getTheme(themeId);
    const milestones = theme.milestones || [];
    return milestones.reduce(
        (best, m) => streak >= m.days ? m : best,
        milestones[0] || { emoji: '🌑', label: 'Beginning', days: 0 }
    );
};

export const getNextMilestone = (themeId, streak) => {
    const theme = getTheme(themeId);
    const milestones = theme.milestones || [];
    return milestones.find(m => streak < m.days) || null;
};

export const getAllThemes = () => Object.values(THEME_REGISTRY);

export const getThemeByIndex = (index) => {
    const themes = Object.values(THEME_REGISTRY);
    return themes[index % themes.length];
};

// Add this function to your themeRegistry.js file

/**
 * Resolves a theme ID to a valid, existing theme ID.
 * Handles undefined/null values and invalid theme IDs by returning a safe default.
 */
export function resolveThemeId(themeId) {
    // If no themeId provided, return first theme or 'sky' as fallback
    if (!themeId) {
        return THEME_LIST[0]?.id || 'sky';
    }
    
    // Check if theme exists in registry
    const theme = getTheme(themeId);
    if (theme) {
        return themeId;
    }
    
    // Theme doesn't exist - fall back to first available theme
    return THEME_LIST[0]?.id || 'sky';
}

export const THEME_LIST = getAllThemes();
export default THEME_REGISTRY;