//C:\quran-similarity-app\frontend\src\features\diary\components\ReflectionCard.jsx
import React from 'react';

export default function ReflectionCard({ hook, activeDate }) {
    const { hifzToday, targetTomorrow, planAction, saveStatus, handleAutoSave } = hook;
    return (
        <div className="diary-card reflection-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                <h3 style={{margin: 0}}>Reflections for {new Date(activeDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                {saveStatus && <span className="save-status-text">{saveStatus}</span>}
            </div>
            <div className="reflection-grid">
                <div className="reflection-field"><label>1) How was your Hifz today?</label><textarea placeholder="Reflect..." value={hifzToday} onChange={(e) => handleAutoSave('hifz', e.target.value)} rows={4}></textarea></div>
                <div className="reflection-field"><label>2) What's the target for tomorrow?</label><textarea placeholder="Pages, Juzz..." value={targetTomorrow} onChange={(e) => handleAutoSave('target', e.target.value)} rows={3}></textarea></div>
                <div className="reflection-field"><label>3) Plan of action?</label><textarea placeholder="Time blocks..." value={planAction} onChange={(e) => handleAutoSave('plan', e.target.value)} rows={3}></textarea></div>
            </div>
        </div>
    );
}