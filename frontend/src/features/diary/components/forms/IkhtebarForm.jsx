// C:\quran-similarity-app\frontend\src\features\diary\components\forms\IkhtebarForm.jsx
import React from 'react';

export default function IkhtebarForm({ hook }) {
    const { ikhtebarFrom, setIkhtebarFrom, ikhtebarTo, setIkhtebarTo, ikhtebarTemplate, ikhtebarPagesMap, generateTemplate, updateTemplate, resetAll } = hook;

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
                    <label>From Juzz:</label>
                    <input type="number" min="1" max="30" value={ikhtebarFrom} onChange={e => setIkhtebarFrom(e.target.value)} placeholder="1" />
                </div>
                <div className="range-group">
                    <label>To Juzz:</label>
                    <input type="number" min="1" max="30" value={ikhtebarTo} onChange={e => setIkhtebarTo(e.target.value)} placeholder="30" />
                </div>
                <button type="button" className="submit-btn secondary" onClick={generateTemplate}>Generate Template</button>
            </div>

            {ikhtebarTemplate.length > 0 && (
                <>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '10px 0' }}>
                        Click <strong>Save Log</strong> below when done.
                    </p>
                    {ikhtebarTemplate.map((t, index) => (
                        <div key={t.juzz} className="ikhtebar-block">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0 }}>Juzz {t.juzz}</h4>
                                <div className="suwal-body" style={{ flex: '0 0 auto', gap: '10px', alignItems: 'center' }}>
                                    <select value={t.page} onChange={(e) => updateTemplate(index, 'page', e.target.value)} required>
                                        <option value="">Select Page</option>
                                        {(ikhtebarPagesMap[t.juzz] || []).map(p => <option key={p} value={p}>Page {p}</option>)}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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