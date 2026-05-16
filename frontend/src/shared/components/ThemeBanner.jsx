// C:\quran-similarity-app\frontend\src\shared\components\ThemeBanner.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getCurrentTheme } from '../services/themeApi';
import { getTheme, getCurrentMilestone, getNextMilestone } from '../utils/themeRegistry';
import ThemeSelector from './ThemeSelector';
import ImmersiveView from './ImmersiveView';
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

    // All hooks before early returns
    const theme = themeData ? getTheme(themeData.theme_id) : null;
    const streak = themeData?.streak || 0;
    const canSwitch = themeData?.can_switch ?? false;
    const hasTheme = themeData?.has_theme ?? false;

    const particles = useMemo(() => {
        if (!theme) return '';
        return theme.particles(streak);
    }, [theme, streak]);

    const bg = useMemo(() => {
        if (!theme) return 'linear-gradient(180deg,#06060e,#0c0c18)';
        return theme.bg(streak);
    }, [theme, streak]);

    const milestone = useMemo(() => {
        if (!theme) return { days: 0, emoji: '🌑', label: '' };
        return getCurrentMilestone(theme, streak);
    }, [theme, streak]);

    const next = useMemo(() => {
        if (!theme) return null;
        return getNextMilestone(theme, streak);
    }, [theme, streak]);

    const daysLeft = next ? next.days - streak : null;
    const visibleMilestones = theme
        ? theme.milestones.filter(m => m.days > 0 && m.days <= streak)
        : [];

    // Early returns AFTER all hooks
    if (!themeData) {
        return <div className="theme-banner-loading">Loading...</div>;
    }

    if (!hasTheme) {
        return <ThemeSelector isForced onSelect={handleThemeChange} />;
    }

    // Immersive view takes over entire screen
    if (showImmersive) {
        return (
            <ImmersiveView
                themeId={themeData.theme_id}
                streak={themeData.streak}
                onClose={() => setShowImmersive(false)}
            />
        );
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
                    <div className="theme-particles" style={{ boxShadow: particles }} />
                    <div
                        className="theme-particles theme-twinkle"
                        style={{ boxShadow: particles }}
                    />

                    {visibleMilestones.map((m, i) => (
                        <span
                            key={m.days}
                            className="milestone-emoji"
                            style={{
                                left: `${(i + 1) * (80 / (visibleMilestones.length + 1))}%`,
                                animationDelay: `${i * 0.3}s`
                            }}
                        >
                            {m.emoji}
                        </span>
                    ))}

                    {streak === 0 && (
                        <div className="theme-empty-msg">Your journey awaits...</div>
                    )}
                </div>

                <div className="theme-info-bar" style={{ background: theme.bar }}>
                    <div className="theme-milestone">
                        <span className="milestone-icon">{milestone.emoji}</span>
                        <div>
                            <span className="milestone-label">
                                {streak === 0
                                    ? 'Begin Your Journey'
                                    : `${streak} Day${streak !== 1 ? 's' : ''} · ${milestone.label}`}
                            </span>
                            {next && streak > 0 && (
                                <span className="next-milestone">
                                    {daysLeft}d until {next.emoji} {next.label}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="theme-right">
    <div className="theme-quote">
        <p>"{quote}"</p>
    </div>

    <button
        className="theme-switch-btn"
        onClick={(e) => {
            e.stopPropagation();
            setShowSelector(true);
        }}
        title="Switch theme"
    >
        🎨
    </button>

    <button
        className="theme-enter-btn"
        onClick={(e) => {
            e.stopPropagation();
            setShowImmersive(true);
        }}
        title="Enter your world"
    >
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