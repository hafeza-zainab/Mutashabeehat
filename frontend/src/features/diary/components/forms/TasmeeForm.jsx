// C:\quran-similarity-app\frontend\src\features\diary\components\forms\TasmeeForm.jsx
import React from 'react';

export default function TasmeeForm({ hook }) {
    const { tasmeeStart, setTasmeeStart, tasmeeEnd, setTasmeeEnd, tasmeeTemplate, generateTemplate, updateTemplate, resetAll } = hook;

    const handleScoreChange = (index, value) => {
        let v = parseFloat(value);
        if (isNaN(v)) v = 0;
        v = Math.round(v * 100) / 100;
        if (v < 0) v = 0;
        if (v > 10) v = 10;
        updateTemplate(index, 'score', v);
    };

    const getScoreClass = (score) => {
        if (score <= 5.75) return 'marks-red';
        if (score <= 7.75) return 'marks-yellow';
        return 'marks-green';
    };

    return (
        <div className="ikhtebar-container">
            <div className="ikhtebar-range-input">
                <div className="range-group">
                    <label>Start Page:</label>
                    <input type="number" min="1" max="604" value={tasmeeStart} onChange={e => setTasmeeStart(e.target.value)} placeholder="e.g. 150" />
                </div>
                <div className="range-group">
                    <label>End Page:</label>
                    <input type="number" min="1" max="604" value={tasmeeEnd} onChange={e => setTasmeeEnd(e.target.value)} placeholder="e.g. 155" />
                </div>
                <button type="button" className="submit-btn secondary" onClick={generateTemplate}>Generate Template</button>
            </div>

            {tasmeeTemplate.length > 0 && (
                <>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '10px 0' }}>
                        Juzz automatically detected. Click <strong>Save Log</strong> below when done.
                    </p>
                    {tasmeeTemplate.map((t, index) => (
                        <div key={t.page} className="ikhtebar-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0 }}>Juzz {t.juzz} - Page {t.page}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Marks:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="any"
                                        value={t.score}
                                        onChange={(e) => handleScoreChange(index, e.target.value)}
                                        className={`marks-input ${getScoreClass(t.score)}`}
                                    />
                                </div>
                            </div>
                            <textarea
                                className="entry-notes"
                                placeholder="Comments (optional)..."
                                value={t.notes || ''}
                                onChange={(e) => updateTemplate(index, 'notes', e.target.value)}
                                rows={2}
                            />
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}