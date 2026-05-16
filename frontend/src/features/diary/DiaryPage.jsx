// C:\quran-similarity-app\frontend\src\features\diary\DiaryPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../shared/context/AuthContext';
import useMurajahForm from './hooks/useMurajahForm';
import useTasmeeForm from './hooks/useTasmeeForm';
import useIkhtebarForm from './hooks/useIkhtebarForm';
import useJadeedForm from './hooks/useJadeedForm';
import useJuzzHaliForm from './hooks/useJuzzHaliForm';
import useReflection from './hooks/useReflection';

import LogHistory from './components/LogHistory';
import ReflectionCard from './components/ReflectionCard';
import ThemeBanner from '../../shared/components/ThemeBanner';
import DailyTasksPage from '../tasks/components/DailyTask';
import PerformanceAnalyticsView from '../analytics/PerformanceAnalyticsView';
import QuranMapView from '../analytics/components/QuranMapView';
import { addLog, getLogs } from '../../shared/services/diaryApi';

import MurajahForm from './components/forms/MurajahForm';
import TasmeeForm from './components/forms/TasmeeForm';
import IkhtebarForm from './components/forms/IkhtebarForm';
import JadeedForm from './components/forms/JadeedForm';
import JuzzHaliForm from './components/forms/JuzzHaliForm';

export default function DiaryPage() {
    const { user } = useAuthContext();
    const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('murajah');
    const [saveMessage, setSaveMessage] = useState('');

    const murajah = useMurajahForm();
    const tasmee = useTasmeeForm();
    const ikhtebar = useIkhtebarForm();
    const jadeed = useJadeedForm();
    const juzzHali = useJuzzHaliForm();
    const reflection = useReflection(activeDate);

    const [logs, setLogs] = useState([]);
    
    const renderActiveForm = () => {
        switch (activeTab) {
            case 'murajah': return <MurajahForm hook={murajah} />;
            case 'tasmee': return <TasmeeForm hook={tasmee} />;
            case 'ikhtebar': return <IkhtebarForm hook={ikhtebar} />;
            case 'jadeed': return <JadeedForm hook={jadeed} />;
            case 'juzz_hali': return <JuzzHaliForm hook={juzzHali} />;
            default: return null;
        }
    };

    const changeDateByOffset = (offset) => {
        const d = new Date(activeDate + 'T00:00:00');
        d.setDate(d.getDate() + offset);
        const newDate = new Date(d).toISOString().split('T')[0];
        if (newDate < '2020-01-01') return;
        setActiveDate(newDate);
    };

    const refreshLogs = () => {
        getLogs(activeDate).then(d => { 
            if(d.success) setLogs(d.data); 
        }).catch(err => console.error(err));
    };

    useEffect(() => { refreshLogs(); }, [activeDate]);

    const handleSave = async (e) => {
    e.preventDefault();
    try {
        let res;
        if (activeTab === 'murajah') {
            const payload = { entries: murajah.buildFinalPayload(), date: activeDate };
            if (!Array.isArray(payload.entries) || payload.entries.length === 0) throw new Error("Please generate a template first.");
            res = await addLog(payload, activeTab);
        }
        else if (activeTab === 'tasmee') {
            const payload = { entries: tasmee.buildFinalPayload(), date: activeDate };
            if (!Array.isArray(payload.entries) || payload.entries.length === 0) throw new Error("Please generate a template first.");
            res = await addLog(payload, activeTab);
        }
        else if (activeTab === 'ikhtebar') {
            const payload = { entries: ikhtebar.buildFinalPayload(), date: activeDate };
            if (!Array.isArray(payload.entries) || payload.entries.length === 0) throw new Error("Please generate a template first.");
            res = await addLog(payload, activeTab);
        }
        else if (activeTab === 'juzz_hali') {
            const validationError = juzzHali.validate();
            if (validationError) throw new Error(validationError);
            const payload = { entries: juzzHali.buildFinalPayload(), date: activeDate };
            res = await addLog(payload, activeTab);
        }
        else if (activeTab === 'jadeed') {
            const payload = jadeed.buildFinalPayload(activeDate);
            res = await addLog(payload, activeTab);
        }
        else {
            throw new Error("Unknown tab type");
        }

        if (res && res.success) {
            alert("Saved!");
            getLogs(activeDate).then(d => { if (d.success) setLogs(d.data); });
            murajah.resetAll(); tasmee.resetAll(); ikhtebar.resetAll(); jadeed.resetForm(); juzzHali.resetAll();
        } else {
            alert("Failed to save: " + (res?.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Save Error:", error);
        alert("Failed to save: " + error.message);
    }
    };

    if (!user) return <div className="auth-container"><div className="auth-card"><h2>Please Login</h2></div></div>;

    return (
        <div className="diary-page-container">
            console.log('ThemeBanner type:', typeof ThemeBanner);
            <ThemeBanner />
            <DailyTasksPage activeDate={activeDate} />
            <div className="diary-book">
                <div className="diary-nav-header">
                    <button className="nav-arrow" onClick={() => changeDateByOffset(-1)} disabled={activeDate <= '2020-01-01'}>←</button>
                    <div className="nav-center">
                        <input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} className="date-picker" />
                    </div>
                    <button className="nav-arrow" onClick={() => changeDateByOffset(1)}>→</button>
                </div>
                <div className="diary-page-content">
                    <div className="diary-card">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h3 style={{margin: 0}}>Log New Entry</h3>
                            {saveMessage && <span className="save-status-text" style={{color: saveMessage.includes('✅') ? '#10B981' : '#DC2626'}}>{saveMessage}</span>}
                        </div>
                        <div className="diary-tabs">
                            {['murajah', 'tasmee', 'ikhtebar', 'jadeed', 'juzz_hali'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'active' : ''}>
                                    {tab === 'ikhtebar' ? 'IKHTEBAR' : tab.replace('_', ' ').toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <form onSubmit={(e) => {handleSave(e)}} className="log-form">
                            {renderActiveForm()}
                            <button type="submit" className="submit-btn" style={{marginTop: '20px'}}>Save Log</button>
                        </form>
                    </div>
                    <LogHistory logs={logs} activeDate={activeDate} reload={refreshLogs} />
                    <ReflectionCard hook={reflection} activeDate={activeDate} />
                </div>
            </div>
            <PerformanceAnalyticsView activeDate={activeDate} />
        </div>
    );
}