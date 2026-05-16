//C:\quran-similarity-app\frontend\src\features\diary\hooks\useMurajahForm.js
import { useState } from 'react';
import { fetchJuzzPages } from '../../../shared/services/similarityApi';

export default function useMurajahForm() {
    const [currentJuzzInput, setCurrentJuzzInput] = useState('');
    const [availablePages, setAvailablePages] = useState([]);
    const [activeSuwal, setActiveSuwal] = useState([{ id: 1, page: '', score: 8, notes: '' }]);
    const [queuedJuzzData, setQueuedJuzzData] = useState([]);

    const loadPagesForJuzz = async (juzzNum) => {
        if (!juzzNum || juzzNum < 1 || juzzNum > 30) { setAvailablePages([]); return; }
        const pages = await fetchJuzzPages(juzzNum);
        setAvailablePages(pages || []);
    };

    const handleGenerateTemplate = () => {
        if (!currentJuzzInput || availablePages.length === 0) return alert("Enter valid Juzz.");
        setActiveSuwal([{ id: 1, page: '', score: 8, notes: '' }]);
    };

    const addNewSuwal = () => setActiveSuwal([...activeSuwal, { id: activeSuwal.length + 1, page: '', score: 8, notes: '' }]);
    
    const updateSuwal = (index, field, value) => {
        const updated = [...activeSuwal];
        updated[index][field] = field === 'score' ? Number(value) : value;
        setActiveSuwal(updated);
    };

    const removeSuwal = (index) => setActiveSuwal(activeSuwal.filter((_, i) => i !== index));

    const queueJuzz = () => {
        if (!currentJuzzInput || !activeSuwal.every(s => s.page !== '')) return alert("Select pages for all Suwal.");
        setQueuedJuzzData([...queuedJuzzData, { juzz: currentJuzzInput, suwal: activeSuwal }]);
        resetCurrentJuzz();
    };

    const buildFinalPayload = () => {
        const finalQueue = [...queuedJuzzData];
        if (activeSuwal.some(s => s.page !== '') && currentJuzzInput) {
            finalQueue.push({ juzz: currentJuzzInput, suwal: activeSuwal });
        }
        return finalQueue.flatMap(j => j.suwal.map(s => ({ 
            range_from: `Juzz ${j.juzz} - Su'al ${s.id} (Pg ${s.page})`, 
            score: s.score, 
            notes: s.notes || "" 
        })));
    };

    const resetCurrentJuzz = () => { setCurrentJuzzInput(''); setAvailablePages([]); setActiveSuwal([{ id: 1, page: '', score: 8, notes: '' }]); };
    const resetAll = () => { resetCurrentJuzz(); setQueuedJuzzData([]); };

    return { currentJuzzInput, setCurrentJuzzInput, availablePages, activeSuwal, queuedJuzzData, loadPagesForJuzz, handleGenerateTemplate, addNewSuwal, updateSuwal, removeSuwal, queueJuzz, buildFinalPayload, resetCurrentJuzz, resetAll };
}