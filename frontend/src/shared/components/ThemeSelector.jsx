// C:\quran-similarity-app\frontend\src\shared\components\ThemeSelector.jsx
import React, { useState, useEffect } from 'react';
import { getAllThemes, selectTheme, checkPreview } from '../services/themeApi';
import { THEME_LIST } from '../utils/themeRegistry';
import '../../styles/ThemeSelector.css';

const PREVIEW_STREAKS = {
    forest: 365, house: 200, sky: 100, lanterns: 60, garden: 30,
    library: 14, mountain: 7, oasis: 200, ship: 100, city: 365
};

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
            if (previewRes.success && previewRes.data.alreadySelected) {
                setMode('select');
            }
        };
        load();
    }, []);

    const handleSelect = async (themeId) => {
        setLoading(true);
        setError('');
        const res = await selectTheme(themeId);
        if (res.success) {
            onSelect();
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    const getUserProgress = (themeId) => {
        const ut = userThemes.find(t => t.theme_id === themeId);
        return { streak: ut?.streak || 0, max: ut?.max_streak || 0, isActive: ut?.is_active === 1 };
    };

    // ─── PREVIEW MODE ───
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
                            const previewStreak = PREVIEW_STREAKS[theme.id] || 100;
                            const bg = theme.bg(previewStreak);

                            return (
                                <div key={theme.id} className="ts-preview-card">
                                    <div className="ts-preview-large" style={{ background: bg }}>
                                        <span className="ts-preview-icon">{theme.icon}</span>
                                        <div className="ts-preview-label">
                                            {previewStreak >= 365 ? '5 Years' :
                                             previewStreak >= 100 ? 'Advanced' :
                                             previewStreak >= 30 ? 'Growing' : 'Beginning'}
                                        </div>
                                    </div>
                                    <div className="ts-info">
                                        <div className="ts-name">{theme.name}</div>
                                        <div className="ts-tagline">{theme.tagline}</div>
                                        <div className="ts-milestone-list">
                                            {theme.milestones
                                                .filter(m => m.days > 0)
                                                .map(m => (
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

    // ─── SELECT MODE ───
    return (
        <div className="theme-selector-overlay" onClick={!isForced ? onClose : undefined}>
            <div className="theme-selector-modal" onClick={e => e.stopPropagation()}>
                <div className="ts-header">
                    <div>
                        <h2>{isForced ? 'Choose Your Theme' : 'Switch Theme'}</h2>
                        <p className="ts-subtitle">Your progress is saved — switch anytime</p>
                    </div>
                    {!isForced && (
                        <button className="ts-close" onClick={onClose}>✕</button>
                    )}
                </div>

                {error && <div className="ts-error">{error}</div>}

                <div className="ts-grid">
                    {THEME_LIST.map(theme => {
                        const progress = getUserProgress(theme.id);
                        const isActive = progress.isActive;
                        const displayStreak = progress.streak || 0;
                        const milestone = theme.milestones
                            .filter(m => m.days > 0)
                            .reduce((best, m) => displayStreak >= m.days ? m : best,
                                theme.milestones[0]
                            );

                        return (
                            <button
                                key={theme.id}
                                className={`ts-card ${isActive ? 'ts-active' : ''}`}
                                onClick={() => !isActive && !loading && handleSelect(theme.id)}
                                disabled={isActive || loading}
                            >
                                <div
                                    className="ts-preview"
                                    style={{ background: theme.bg(displayStreak) }}
                                >
                                    {isActive && <span className="ts-active-badge">Active</span>}
                                    <span className="ts-preview-emoji">{theme.icon}</span>
                                </div>

                                <div className="ts-info">
                                    <div className="ts-name">{theme.name}</div>
                                    <div className="ts-tagline">{theme.tagline}</div>

                                    {displayStreak > 0 && (
                                        <div className="ts-progress">
                                            <div className="ts-progress-bar">
                                                <div
                                                    className="ts-progress-fill"
                                                    style={{
                                                        width: `${Math.min((displayStreak / 365) * 100, 100)}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="ts-progress-text">
                                                {displayStreak} days · {milestone.emoji}
                                            </span>
                                        </div>
                                    )}

                                    {isActive && (
                                        <div className="ts-current-info">
                                            Viewing · {milestone.emoji}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {loading && (
                    <div className="ts-loading-overlay">Switching...</div>
                )}
            </div>
        </div>
    );
}