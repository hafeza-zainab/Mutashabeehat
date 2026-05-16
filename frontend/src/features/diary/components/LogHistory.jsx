// C:\quran-similarity-app\frontend\src\features\diary\components\LogHistory.jsx
import React, { useState } from 'react';
import { deleteLog, updateLog } from '../../../shared/services/diaryApi';

export default function LogHistory({ logs, activeDate, reload }) {
    const [editingLogId, setEditingLogId] = useState(null);
    const [editData, setEditData] = useState({ score: 8, notes: '' });

    const startEdit = (log) => { 
        setEditingLogId(log.id); 
        setEditData({ 
            score: log.score, 
            notes: log.notes || '' 
        }); 
    };

    const cancelEdit = () => setEditingLogId(null);

    const saveEdit = async (id) => { 
        const res = await updateLog(id, editData); 
        if (res.success) { 
            setEditingLogId(null); 
            reload(); 
        } 
    };

    return (
        <div className="diary-card" style={{marginTop: '25px'}}>
            <h3>
                History for {new Date(activeDate + 'T00:00:00')
                .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>

            {(!logs || logs.length === 0) ? (
                <p className="empty-state">No logs recorded for this exact day.</p>
            ) : (
                <div className="logs-list">
                    {logs.map(log => (
                        editingLogId === log.id ? (
                            <div key={log.id} className="log-item edit-mode">
                                <div className="edit-log-form">
                                    <div className="metrics compact">
                                        <div className="metric-group" style={{ flex: 'none', width: '120px' }}>
                                            <label>Score (0-10)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                value={editData.score}
                                                onChange={(e) => {
                                                    let val = parseInt(e.target.value);
                                                    if (isNaN(val)) val = 0;
                                                    if (val < 0) val = 0;
                                                    if (val > 10) val = 10;
                                                    setEditData({...editData, score: val});
                                                }}
                                                className={`marks-input ${editData.score <= 5.75 ? 'marks-red' : editData.score <= 7.75 ? 'marks-yellow' : 'marks-green'}`}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <textarea
                                        placeholder="Notes..."
                                        value={editData.notes}
                                        onChange={e => setEditData({...editData, notes: e.target.value})}
                                        rows={2}
                                    ></textarea>

                                    <div className="edit-actions">
                                        <button type="button" className="submit-btn secondary" onClick={cancelEdit}>
                                            Cancel
                                        </button>
                                        <button type="button" className="submit-btn" onClick={() => saveEdit(log.id)}>
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div key={log.id} className="log-item">
                                <div className="log-header">
                                    <span className="log-type">
                                        {log.type.replace('_',' ').toUpperCase()}
                                    </span>
                                    <span style={{fontSize:'13px'}}>
                                        {log.range_from} {log.range_to ? `→ ${log.range_to}` : ''}
                                    </span>
                                </div>

                                <div className="log-stats">
                                    <span className={`score-badge ${log.score <= 5.75 ? 'marks-red' : log.score <= 7.75 ? 'marks-yellow' : 'marks-green'}`}>Score: {log.score}/10</span>
                                </div>

                                {log.notes && <p className="log-notes">{log.notes}</p>}

                                <div className="log-action-btns">
                                    <button className="icon-btn edit" onClick={() => startEdit(log)}>
                                        ✏️ Edit
                                    </button>

                                    <button
                                        className="icon-btn delete"
                                        onClick={() => {
                                            if (window.confirm('Delete?')) {
                                                deleteLog(log.id).then(() => reload());
                                            }
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}