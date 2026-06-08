//C:\quran-similarity-app\frontend\src\shared\components\ThemeSelector.jsx// Modal for selecting or previewing themes, used both on first visit and for switching themes later.
// Fetches user's theme progress to show milestones and disable already selected theme.
import React, { useState, useEffect } from 'react';
import { getAllThemes, selectTheme, checkPreview } from '../services/themeApi';
import { THEME_LIST } from '../utils/themeRegistry';
import '../../styles/ThemeSelector.css';

const PREVIEW_STREAKS = {
    sky: 100, forest: 365, mountain: 7, oasis: 200, ship: 100
};

const THEME_BG = {
    sky:      'linear-gradient(180deg, #06060e 0%, #0c0c20 50%, #080818 100%)',
    forest:   'linear-gradient(180deg, #071407 0%, #0a1f0a 50%, #051505 100%)',
    mountain: 'linear-gradient(180deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
    oasis:    'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)',
    ship:     'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 40%, #0369a1 100%)',
};

const getThemeBg = (themeId) => THEME_BG[themeId] || THEME_BG.sky;

export default function ThemeSelector({ isForced, onSelect, onClose }) {
    const [mode, setMode] = useState('preview');
    const [userThemes, setUserThemes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            const previewRes = await checkPreview();
            const themesRes = await getAllThemes();
            if (themesRes.success) setUserThemes(themesRes.data.themes || []);
            if (previewRes.success && previewRes.data.alreadySelected) setMode('select');
        };
        load();
    }, []);

    const handleSelect = async (themeId) => {
        setLoading(true);
        setError('');
        const res = await selectTheme(themeId);
        if (res.success) { onSelect(); } else { setError(res.message); }
        setLoading(false);
    };

    const getUserProgress = (themeId) => {
        const ut = userThemes.find(t => t.theme_id === themeId);
        return { streak: ut?.streak || 0, max: ut?.max_streak || 0, isActive: ut?.is_active === 1 };
    };

    if (mode === 'preview') {
        return (
            <div className="theme-selector-overlay">
                <div className="theme-selector-modal">
                    <div className="ts-header">
                        <div>
                            <h2>Explore Your Journey</h2>
                            <p className="ts-subtitle">Each theme evolves differently over time</p>
                        </div>
                    </div>
                    <div className="ts-grid ts-preview-grid">
                        {THEME_LIST.map(theme => {
                            const bg = getThemeBg(theme.id);
                            return (
                                <div key={theme.id} className="ts-preview-card">
                                    <div className="ts-preview-large" style={{ background: bg }}>
                                        <span className="ts-preview-icon">{theme.icon}</span>
                                        <div className="ts-preview-label">
                                            {(PREVIEW_STREAKS[theme.id] || 0) >= 365 ? '1 Year' :
                                             (PREVIEW_STREAKS[theme.id] || 0) >= 100 ? 'Advanced' :
                                             (PREVIEW_STREAKS[theme.id] || 0) >= 30  ? 'Growing' : 'Beginning'}
                                        </div>
                                    </div>
                                    <div className="ts-info">
                                        <div className="ts-name">{theme.name}</div>
                                        <div className="ts-tagline">{theme.tagline}</div>
                                        <div className="ts-milestone-list">
                                            {theme.milestones.filter(m => m.days > 0).map(m => (
                                                <span key={m.days} className="ts-milestone-chip">
                                                    {m.emoji} {m.days}d
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="ts-footer">
                        <button className="ts-continue-btn" onClick={() => setMode('select')}>
                            Choose Your Theme →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="theme-selector-overlay" onClick={!isForced ? onClose : undefined}>
            <div className="theme-selector-modal" onClick={e => e.stopPropagation()}>
                <div className="ts-header">
                    <div>
                        <h2>{isForced ? 'Choose Your Theme' : 'Switch Theme'}</h2>
                        <p className="ts-subtitle">Your progress is saved — switch anytime</p>
                    </div>
                    {!isForced && <button className="ts-close" onClick={onClose}>✕</button>}
                </div>

                {error && <div className="ts-error">{error}</div>}

                <div className="ts-grid">
                    {THEME_LIST.map(theme => {
                        const progress = getUserProgress(theme.id);
                        const isActive = progress.isActive;
                        const displayStreak = progress.streak || 0;
                        const milestone = theme.milestones
                            .filter(m => m.days > 0)
                            .reduce((best, m) => displayStreak >= m.days ? m : best, theme.milestones[0]);

                        return (
                            <button
                                key={theme.id}
                                className={`ts-card ${isActive ? 'ts-active' : ''}`}
                                onClick={() => !isActive && !loading && handleSelect(theme.id)}
                                disabled={isActive || loading}
                            >
                                <div className="ts-preview" style={{ background: getThemeBg(theme.id) }}>
                                    {isActive && <span className="ts-active-badge">Active</span>}
                                    <span className="ts-preview-emoji">{theme.icon}</span>
                                </div>
                                <div className="ts-info">
                                    <div className="ts-name">{theme.name}</div>
                                    <div className="ts-tagline">{theme.tagline}</div>
                                    {displayStreak > 0 && (
                                        <div className="ts-progress">
                                            <div className="ts-progress-bar">
                                                <div className="ts-progress-fill" style={{ width: `${Math.min((displayStreak / 365) * 100, 100)}%` }} />
                                            </div>
                                            <span className="ts-progress-text">{displayStreak} days · {milestone.emoji}</span>
                                        </div>
                                    )}
                                    {isActive && <div className="ts-current-info">Active · {milestone.emoji} {milestone.label}</div>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {loading && <div className="ts-loading-overlay">Switching...</div>}
            </div>
        </div>
    );
}