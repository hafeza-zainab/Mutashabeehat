//C:\quran-similarity-app\frontend\src\features\diary\hooks\useReflection.js
import { useState, useRef } from 'react';
import { saveReflection, getReflection } from '../../../shared/services/diaryApi';

export default function useReflection(activeDate) {
    const [hifzToday, setHifzToday] = useState('');
    const [targetTomorrow, setTargetTomorrow] = useState('');
    const [planAction, setPlanAction] = useState('');
    const [saveStatus, setSaveStatus] = useState('');
    const saveTimeoutRef = useRef(null);

    const handleAutoSave = (field, value) => {
        let uH = hifzToday, uT = targetTomorrow, uP = planAction;
        if (field === 'hifz') { setHifzToday(value); uH = value; }
        if (field === 'target') { setTargetTomorrow(value); uT = value; }
        if (field === 'plan') { setPlanAction(value); uP = value; }
        setSaveStatus('Saving...');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try { await saveReflection({ date: activeDate, hifz_today: uH, target_tomorrow: uT, plan_action: uP }); setSaveStatus('Saved ✓'); } catch (err) { setSaveStatus('Error'); }
        }, 1000);
    };

    return { hifzToday, setHifzToday, targetTomorrow, setTargetTomorrow, planAction, setPlanAction, saveStatus, handleAutoSave };
}