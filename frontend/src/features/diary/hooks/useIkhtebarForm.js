//C:\quran-similarity-app\frontend\src\features\diary\hooks\useIkhtebarForm.js
import { useState } from 'react';
import { fetchJuzzPages } from '../../../shared/services/similarityApi';

export default function useIkhtebarForm() {
    const [ikhtebarFrom, setIkhtebarFrom] = useState('');
    const [ikhtebarTo, setIkhtebarTo] = useState('');
    const [ikhtebarTemplate, setIkhtebarTemplate] = useState([]);
    const [ikhtebarPagesMap, setIkhtebarPagesMap] = useState({});

    const generateTemplate = async () => {
        const from = parseInt(ikhtebarFrom), to = parseInt(ikhtebarTo);
        if (!from || !to || from > to || from < 1 || to > 30) return alert("Invalid Juzz range (1-30).");
        
        const results = await Promise.all(Array.from({length: to - from + 1}, (_, i) => fetchJuzzPages(from + i)));
        let newMap = {}; let template = [];
        results.forEach((pages, index) => {
            const juzzNum = from + index;
            newMap[juzzNum] = pages || [];
            template.push({ juzz: juzzNum, page: '', score: 8, notes: '' });
        });
        setIkhtebarPagesMap(newMap);
        setIkhtebarTemplate(template);
    };

    const updateTemplate = (index, field, value) => {
        const updated = [...ikhtebarTemplate];
        updated[index][field] = field === 'score' ? Number(value) : value;
        setIkhtebarTemplate(updated);
    };

    const buildFinalPayload = () => ikhtebarTemplate.map(t => ({ 
        range_from: `Juzz ${t.juzz} - Su'al 1 (Pg ${t.page})`, 
        score: t.score, 
        notes: t.notes || "" 
    }));
    
    const resetAll = () => { setIkhtebarFrom(''); setIkhtebarTo(''); setIkhtebarTemplate([]); setIkhtebarPagesMap({}); };

    return { ikhtebarFrom, setIkhtebarFrom, ikhtebarTo, setIkhtebarTo, ikhtebarTemplate, ikhtebarPagesMap, generateTemplate, updateTemplate, buildFinalPayload, resetAll };
}