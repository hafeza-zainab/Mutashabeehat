//C:\quran-similarity-app\frontend\src\shared\components\ThemeBanner.jsx// Displays the current theme, user's progress, and a daily inspirational quote.
// Click to enter the immersive view. Also allows switching themes if eligible.
import React, { useState, useEffect, useMemo } from 'react';
import { getCurrentTheme } from '../services/themeApi';
import { getTheme, getCurrentMilestone, getNextMilestone } from '../utils/themeRegistry';
import ThemeSelector from './ThemeSelector';
import ImmersiveView from './ImmersiveView/ImmersiveView';
import '../../styles/ThemeBanner.css';

const QUOTES = [
    "The deed dearest to Allah is that which is most consistent, even if it is small.",
    "The most beloved deed to Allah is the most regular and constant even if it were little.",
    "Whoever treads a path in search of knowledge, Allah will make easy for him the path to Paradise.",
    "Read the Qur'an, for it will come as an intercessor on the Day of Resurrection.",
    "Facilitate, do not Hinder.",
    "Seeking knowledge is obligatory upon every Muslim.",
    "Is anyone among you incapable of earning a thousand good deeds every day?"
];

const THEME_BG = {
    sky:      'linear-gradient(180deg, #06060e 0%, #0c0c20 50%, #080818 100%)',
    forest:   'linear-gradient(180deg, #071407 0%, #0a1f0a 50%, #051505 100%)',
    mountain: 'linear-gradient(180deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)',
    oasis:    'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)',
    ship:     'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 40%, #0369a1 100%)',
};

const THEME_BAR = {
    sky:      'rgba(6,6,20,0.92)',
    forest:   'rgba(5,21,5,0.92)',
    mountain: 'rgba(30,40,55,0.92)',
    oasis:    'rgba(100,60,10,0.92)',
    ship:     'rgba(8,50,90,0.92)',
};

export default function ThemeBanner() {
    const [themeData, setThemeData] = useState(null);
    const [showSelector, setShowSelector] = useState(false);
    const [showImmersive, setShowImmersive] = useState(false);
    const [quote, setQuote] = useState('');

    useEffect(() => {
        const load = async () => {
            const res = await getCurrentTheme();
            if (res.success) setThemeData(res.data);
        };
        load();
        const dayOfYear = Math.floor(
            (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
        );
        setQuote(QUOTES[dayOfYear % QUOTES.length]);
    }, []);

    const handleThemeChange = () => {
        setShowSelector(false);
        setTimeout(async () => {
            const res = await getCurrentTheme();
            if (res.success) setThemeData(res.data);
        }, 150);
    };

    const themeId = themeData?.theme_id || 'sky';
    const streak  = themeData?.streak || 0;
    const canSwitch = themeData?.can_switch ?? false;
    const hasTheme  = themeData?.has_theme ?? false;

    const theme = useMemo(() => getTheme(themeId), [themeId]);
    const bg    = THEME_BG[themeId]  || THEME_BG.sky;
    const bar   = THEME_BAR[themeId] || THEME_BAR.sky;

    const milestone = useMemo(() => getCurrentMilestone(themeId, streak), [themeId, streak]);
    const next      = useMemo(() => getNextMilestone(themeId, streak), [themeId, streak]);
    const daysLeft  = next ? next.days - streak : null;

    const visibleMilestones = useMemo(
        () => (theme?.milestones || []).filter(m => m.days > 0 && m.days <= streak),
        [theme, streak]
    );

    if (!themeData) return <div className="theme-banner-loading">Loading...</div>;
    if (!hasTheme)  return <ThemeSelector isForced onSelect={handleThemeChange} />;

    if (showImmersive) {
        return <ImmersiveView themeId={themeId} streak={streak} onClose={() => setShowImmersive(false)} />;
    }

    return (
        <>
            <div
                className="theme-banner-container"
                onClick={() => setShowImmersive(true)}
                style={{ cursor: 'pointer' }}
                title="Click to enter your world"
            >
                <div className="theme-viewport" style={{ background: bg }}>
                    {visibleMilestones.map((m, i) => (
                        <span
                            key={m.days}
                            className="milestone-emoji"
                            style={{ left: `${(i + 1) * (80 / (visibleMilestones.length + 1))}%`, animationDelay: `${i * 0.3}s` }}
                        >
                            {m.emoji}
                        </span>
                    ))}
                    {streak === 0 && <div className="theme-empty-msg">Your journey awaits...</div>}
                </div>

                <div className="theme-info-bar" style={{ background: bar }}>
                    <div className="theme-milestone">
                        <span className="milestone-icon">{milestone.emoji}</span>
                        <div>
                            <span className="milestone-label">
                                {streak === 0 ? 'Begin Your Journey' : `${streak} Day${streak !== 1 ? 's' : ''} · ${milestone.label}`}
                            </span>
                            {next && streak > 0 && (
                                <span className="next-milestone">{daysLeft}d until {next.emoji} {next.label}</span>
                            )}
                        </div>
                    </div>
                    <div className="theme-right">
                        <div className="theme-quote"><p>"{quote}"</p></div>
                        <button className="theme-switch-btn" onClick={e => { e.stopPropagation(); setShowSelector(true); }} title="Switch theme">🎨</button>
                        <button className="theme-enter-btn" onClick={e => { e.stopPropagation(); setShowImmersive(true); }} title="Enter your world">
                            <span className="enter-icon">⬇</span>
                        </button>
                    </div>
                </div>
            </div>

            {showSelector && (
                <ThemeSelector
                    currentStreak={streak}
                    canSwitch={canSwitch}
                    onSelect={handleThemeChange}
                    onClose={() => setShowSelector(false)}
                />
            )}
        </>
    );
}