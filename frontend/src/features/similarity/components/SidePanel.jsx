// C:\quran-similarity-app\frontend\src\features\similarity\components\SidePanel.jsx
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../shared/context/AppContext';
import { fetchAyahContext } from '../../../shared/services/similarityApi';
import '../../../styles/SidePanel.css';

export default function SidePanel() {
    const { selectedResult } = useAppContext();
    const [context, setContext] = useState(null);
    const [loadingContext, setLoadingContext] = useState(false);

    useEffect(() => {
        if (selectedResult) {
            loadContext(selectedResult.target_surah, selectedResult.target_ayah);
        } else {
            setContext(null);
        }
    }, [selectedResult]);

    const loadContext = async (surah, ayah) => {
        setLoadingContext(true);
        try {
            const res = await fetchAyahContext(surah, ayah);
            if (res.success) setContext(res.data);
        } catch (err) {
            console.error("Failed to load context");
        } finally {
            setLoadingContext(false);
        }
    };

    if (!selectedResult) {
        return (
            <div className="side-panel-empty">
                Click a result card to view memory tips here
            </div>
        );
    }

    return (
        <div className="side-panel">
            <div className="panel-header">Memory Tips & Context</div>
            <div className="panel-body">
                
                {/* Context Section */}
                <div className="context-container">
                    {loadingContext ? (
                        <div className="loading-text">Loading context...</div>
                    ) : context ? (
                        <>
                            {/* Previous Ayah */}
                            {context.prev && (
                                <div className="context-ayah prev">
                                    <div className="context-label">Previous Ayah</div>
                                    <div className="arabic-text-sm" dir="rtl">{context.prev}</div>
                                </div>
                            )}

                            {/* Selected Ayah */}
                            <div className="context-ayah main">
                                <div className="context-label">
                                    Selected Ayah (Surah {selectedResult.target_surah}:{selectedResult.target_ayah})
                                </div>
                                <div className="arabic-text-sm main-text" dir="rtl">{context.current}</div>
                            </div>

                            {/* Next Ayah */}
                            {context.next && (
                                <div className="context-ayah next">
                                    <div className="context-label">Next Ayah</div>
                                    <div className="arabic-text-sm" dir="rtl">{context.next}</div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Match Analysis - Changed to "Focus on" */}
                <div className="tip-context">
                    <strong>Match Analysis</strong>
                    <p className="highlight-mode">
                        Focus on: <span>{selectedResult.highlight_mode}</span>
                    </p>
                    <p>
                        Similarity Score: <span>{Math.round(selectedResult.similarity_score * 100)}%</span>
                    </p>
                </div>

                {/* ❌ TIPS SECTION COMPLETELY REMOVED */}
                
            </div>
        </div>
    );
}