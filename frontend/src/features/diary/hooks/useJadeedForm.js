// C:\quran-similarity-app\frontend\src\features\diary\hooks\useJadeedForm.js
import { useState, useEffect } from 'react';
import { fetchPageDetails } from '../../../shared/services/similarityApi';

export default function useJadeedForm() {
    const [fromPage, setFromPage] = useState('');
    const [toPage, setToPage] = useState('');
    const [fromPageDetails, setFromPageDetails] = useState(null);
    const [toPageDetails, setToPageDetails] = useState(null);
    const [fromSelectedSurah, setFromSelectedSurah] = useState('');
    const [toSelectedSurah, setToSelectedSurah] = useState('');
    const [fromAyah, setFromAyah] = useState('');
    const [toAyah, setToAyah] = useState('');
    const [score, setScore] = useState(8);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (fromPage) {
            fetchPageDetails(fromPage).then(data => {
                setFromPageDetails(data);
                setFromSelectedSurah((data && data.surahs && data.surahs.length === 1) ? String(data.surahs[0].surah) : '');
                setFromAyah('');
            }).catch(() => setFromPageDetails(null));
        } else { setFromPageDetails(null); setFromSelectedSurah(''); setFromAyah(''); }
    }, [fromPage]);

    useEffect(() => {
        if (toPage) {
            fetchPageDetails(toPage).then(data => {
                setToPageDetails(data);
                setToSelectedSurah((data && data.surahs && data.surahs.length === 1) ? String(data.surahs[0].surah) : '');
                setToAyah('');
            }).catch(() => setToPageDetails(null));
        } else { setToPageDetails(null); setToSelectedSurah(''); setToAyah(''); }
    }, [toPage]);

    const getValidAyahs = (details, surah) => {
        if (!details || !details.surahs || !surah) return [];
        const s = details.surahs.find(s => s.surah === Number(surah));
        return s ? s.ayahs : [];
    };

    const buildFinalPayload = (date) => ({
        date,
        juzz: fromPageDetails?.surahs?.[0]?.juzz,
        from_page: fromPage,
        to_page: toPage || fromPage,
        range_from_surah: fromSelectedSurah,
        range_from_ayah: Number(fromAyah),
        range_to_surah: toSelectedSurah,
        range_to_ayah: Number(toAyah),
        range_from_name: fromPageDetails?.surahs?.find(s => s.surah === Number(fromSelectedSurah))?.name || "",
        range_to_name: toPageDetails?.surahs?.find(s => s.surah === Number(toSelectedSurah))?.name || "",
        score: Number(score),
        notes
    });

    const resetForm = () => { setFromPage(''); setToPage(''); setFromAyah(''); setToAyah(''); setNotes(''); };

    return {
        fromPage, setFromPage, toPage, setToPage, fromPageDetails, toPageDetails,
        fromSelectedSurah, setFromSelectedSurah, toSelectedSurah, setToSelectedSurah,
        fromAyah, setFromAyah, toAyah, setToAyah,
        score, setScore, notes, setNotes,
        getValidAyahs, buildFinalPayload, resetForm
    };
}