// C:\quran-similarity-app\frontend\src\features\diary\components\forms\MurajahForm.jsx
import React from 'react';

export default function MurajahForm({ hook }) {
    const { currentJuzzInput, setCurrentJuzzInput, availablePages, activeSuwal, queuedJuzzData, loadPagesForJuzz, handleGenerateTemplate, addNewSuwal, updateSuwal, removeSuwal, queueJuzz, resetCurrentJuzz } = hook;

    const handleScoreChange = (index, value) => {
        let v = parseFloat(value);
        if (isNaN(v)) v = 0;
        v = Math.round(v * 100) / 100;
        if (v < 0) v = 0;
        if (v > 10) v = 10;
        updateSuwal(index, 'score', v);
    };

    const handleNotesChange = (index, value) => {
        updateSuwal(index, 'notes', value);
    };

    const getScoreClass = (score) => {
        if (score <= 5.75) return 'marks-red';
        if (score <= 7.75) return 'marks-yellow';
        return 'marks-green';
    };

    return (
        <div className="murajah-container">
            <div className="murajah-juzz-input">
                <label>Enter Juzz Number:</label>
                <input type="number" min="1" max="30" value={currentJuzzInput} onChange={(e) => { setCurrentJuzzInput(e.target.value); loadPagesForJuzz(e.target.value); }} placeholder="e.g. 5" />
                {availablePages.length > 0 && <button type="button" className="submit-btn secondary" onClick={handleGenerateTemplate}>Generate Template</button>}
            </div>

            {queuedJuzzData.length > 0 && (
                <div className="queued-summary">
                    <strong>Queued for Save:</strong>
                    <div className="queue-badges">
                        {queuedJuzzData.map((q, i) => (
                            <span key={i} className="queue-badge">Juzz {q.juzz} ({q.suwal.length} Suwal)</span>
                        ))}
                    </div>
                </div>
            )}

            {currentJuzzInput && availablePages.length > 0 && (
                <div className="suwal-container">
                    <h4>Juzz {currentJuzzInput} - Active Entry</h4>
                    {activeSuwal.map((s, index) => (
                        <div key={s.id} className="suwal-block">
                            <div className="suwal-header">
                                <strong>سؤال {s.id}</strong>
                                {activeSuwal.length > 1 && <button type="button" className="remove-juzz-btn" onClick={() => removeSuwal(index)}>✕</button>}
                            </div>
                            <div className="suwal-body">
                                <select value={s.page} onChange={(e) => updateSuwal(index, 'page', e.target.value)} required>
                                    <option value="">Select Page</option>
                                    {availablePages.map(p => <option key={p} value={p}>Page {p}</option>)}
                                </select>
                                <div className="metric-group" style={{ flex: '0 0 auto' }}>
                                    <label>Marks:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="any"
                                        value={s.score}
                                        onChange={(e) => handleScoreChange(index, e.target.value)}
                                        className={`marks-input ${getScoreClass(s.score)}`}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <textarea
                                    className="entry-notes"
                                    placeholder="Comments..."
                                    value={s.notes || ''}
                                    onChange={(e) => handleNotesChange(index, e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>
                    ))}
                    <div className="suwal-actions">
                        <button type="button" className="secondary-btn" onClick={addNewSuwal}>+ Add سؤال</button>
                        <button type="button" className="secondary-btn" onClick={queueJuzz}>Enter Next Juzz →</button>
                    </div>
                </div>
            )}
        </div>
    );
}