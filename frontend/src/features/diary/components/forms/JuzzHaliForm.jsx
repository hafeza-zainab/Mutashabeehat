// C:\quran-similarity-app\frontend\src\features\diary\components\forms\JuzzHaliForm.jsx
import React from 'react';

export default function JuzzHaliForm({ hook }) {
    const {
        juzzStart, setJuzzStart, juzzEnd, setJuzzEnd,
        template, generateTemplate, updateTemplate,
        firstPageDetails, lastPageDetails,
        firstSurah, setFirstSurah, lastSurah, setLastSurah,
        firstAyah, setFirstAyah, lastAyah, setLastAyah,
        getValidAyahs
    } = hook;

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

    const isFirstPage = (index) => index === 0;
    const isLastPage = (index) => index === template.length - 1 && template.length > 1;

    const renderAyahSelector = (label, details, surah, setSurah, ayah, setAyah, listId, borderColor) => (
        <div style={{ 
            minWidth: '100%', 
            marginTop: '10px', 
            padding: '12px', 
            background: '#F0FDF4', 
            borderRadius: '8px', 
            border: `1px solid ${borderColor}` 
        }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="range-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ color: '#065F46', fontWeight: 700 }}>{label} <span style={{ color: '#DC2626' }}>*</span></label>
                    {!details?.surahs && <input type="text" disabled value="Loading..." />}
                    {details?.surahs?.length === 1 && <input type="text" disabled value={details.surahs[0].name} className="auto-surah-text" />}
                    {details?.surahs?.length > 1 && (
                        <select value={surah} onChange={e => setSurah(e.target.value)} required>
                            <option value="">Select Surah</option>
                            {details.surahs.map(s => <option key={s.surah} value={s.surah}>{s.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="range-group" style={{ flex: '0 0 120px' }}>
                    <label style={{ color: '#065F46', fontWeight: 700 }}>Ayah <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                        type="number"
                        disabled={!surah}
                        list={listId}
                        placeholder="Ayah"
                        value={ayah}
                        onChange={e => setAyah(e.target.value)}
                        required
                        style={{ padding: '10px', border: '1px solid #D1FAE5', borderRadius: '6px', background: 'white' }}
                    />
                    <datalist id={listId}>{getValidAyahs(details, surah).map(a => <option key={a} value={a} />)}</datalist>
                </div>
            </div>
        </div>
    );

    return (
        <div className="ikhtebar-container">
            <div className="ikhtebar-range-input">
                <div className="range-group">
                    <label>From Page:</label>
                    <input type="number" min="1" max="604" value={juzzStart} onChange={e => setJuzzStart(e.target.value)} placeholder="e.g. 62" />
                </div>
                <div className="range-group">
                    <label>To Page:</label>
                    <input type="number" min="1" max="604" value={juzzEnd} onChange={e => setJuzzEnd(e.target.value)} placeholder="e.g. 81" />
                </div>
                <button type="button" className="submit-btn secondary" onClick={generateTemplate}>Generate Template</button>
            </div>

            {template.length > 0 && (
                <>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '10px 0' }}>
                        {template.length} pages loaded. <strong style={{ color: '#10B981' }}>First</strong> and <strong style={{ color: '#EF4444' }}>Last</strong> page require Ayah details. Click <strong>Save Log</strong> below when done.
                    </p>
                    {template.map((t, index) => (
                        <div key={t.page} className="ikhtebar-block" style={isFirstPage(index) ? { borderLeft: '4px solid #10B981' } : isLastPage(index) ? { borderLeft: '4px solid #EF4444' } : {}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0 }}>
                                    Juzz {t.juzz} - Page {t.page}
                                    {isFirstPage(index) && <span style={{ fontSize: '11px', color: '#10B981', marginLeft: '8px', background: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>START</span>}
                                    {isLastPage(index) && <span style={{ fontSize: '11px', color: '#EF4444', marginLeft: '8px', background: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>END</span>}
                                </h4>
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
                            {isFirstPage(index) && renderAyahSelector("Start Ayah", firstPageDetails, firstSurah, setFirstSurah, firstAyah, setFirstAyah, "jh-first-ayah", "#A7F3D0")}
                            {isLastPage(index) && renderAyahSelector("End Ayah", lastPageDetails, lastSurah, setLastSurah, lastAyah, setLastAyah, "jh-last-ayah", "#FECACA")}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}