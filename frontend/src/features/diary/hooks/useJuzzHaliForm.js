// C:\quran-similarity-app\frontend\src\features\diary\hooks\useJuzzHaliForm.js
import { useState } from 'react';
import { fetchPagesInRange, fetchPageDetails } from '../../../shared/services/similarityApi';

export default function useJuzzHaliForm() {
    const [juzzStart, setJuzzStart] = useState('');
    const [juzzEnd, setJuzzEnd] = useState('');
    const [template, setTemplate] = useState([]);
    
    // Ayah selectors for first and last page
    const [firstPageDetails, setFirstPageDetails] = useState(null);
    const [lastPageDetails, setLastPageDetails] = useState(null);
    const [firstSurah, setFirstSurah] = useState('');
    const [lastSurah, setLastSurah] = useState('');
    const [firstAyah, setFirstAyah] = useState('');
    const [lastAyah, setLastAyah] = useState('');

    const generateTemplate = async () => {
        const start = parseInt(juzzStart);
        const end = parseInt(juzzEnd);
        if (!start || !end || start > end || start < 1 || end > 604) {
            return alert("Invalid page range (1-604).");
        }
        
        const pages = await fetchPagesInRange(start, end);
        if (!pages || pages.length === 0) return alert("No pages found.");

        // Reset ayah fields
        setFirstSurah(''); setLastSurah('');
        setFirstAyah(''); setLastAyah('');
        setFirstPageDetails(null); setLastPageDetails(null);

        const firstPage = pages[0].page;
        const lastPage = pages[pages.length - 1].page;

        // Fetch page details for first and last page simultaneously
        const [fpDetails, lpDetails] = await Promise.all([
            fetchPageDetails(firstPage),
            fetchPageDetails(lastPage)
        ]);

        setFirstPageDetails(fpDetails);
        setLastPageDetails(lpDetails);

        // Auto-select surah if only one option exists
        if (fpDetails?.surahs?.length === 1) setFirstSurah(String(fpDetails.surahs[0].surah));
        if (lpDetails?.surahs?.length === 1) setLastSurah(String(lpDetails.surahs[0].surah));

        setTemplate(pages.map(p => ({
            juzz: p.juzz,
            page: p.page,
            score: 8,
            notes: ''
        })));
    };

    const getValidAyahs = (details, surah) => {
        if (!details || !details.surahs || !surah) return [];
        const s = details.surahs.find(s => s.surah === Number(surah));
        return s ? s.ayahs : [];
    };

    const updateTemplate = (index, field, value) => {
        const updated = [...template];
        updated[index][field] = field === 'score' ? Number(value) : value;
        setTemplate(updated);
    };

    const validate = () => {
        if (template.length === 0) return "Please generate a template first.";
        if (!firstSurah || !firstAyah) return "Start Ayah is required for the first page.";
        if (template.length > 1 && (!lastSurah || !lastAyah)) return "End Ayah is required for the last page.";
        return null;
    };

    const buildFinalPayload = () => {
        const firstPageIndex = 0;
        const lastPageIndex = template.length - 1;

        return template.map((t, index) => {
            let rangeFrom = `Juzz Hali - Juzz ${t.juzz} - Page ${t.page}`;
            let rangeTo = "";

            if (index === firstPageIndex && firstSurah && firstAyah) {
                const surahName = firstPageDetails?.surahs?.find(s => s.surah === Number(firstSurah))?.name || "";
                rangeTo = `Start: ${surahName} (${firstSurah}):${firstAyah}`;
            }

            if (index === lastPageIndex && lastSurah && lastAyah) {
                const surahName = lastPageDetails?.surahs?.find(s => s.surah === Number(lastSurah))?.name || "";
                rangeTo = `End: ${surahName} (${lastSurah}):${lastAyah}`;
            }

            return {
                range_from: rangeFrom,
                score: t.score,
                notes: t.notes || ""
            };
        });
    };

    const resetAll = () => {
        setJuzzStart(''); setJuzzEnd('');
        setTemplate([]);
        setFirstPageDetails(null); setLastPageDetails(null);
        setFirstSurah(''); setLastSurah('');
        setFirstAyah(''); setLastAyah('');
    };

    return {
        juzzStart, setJuzzStart, juzzEnd, setJuzzEnd,
        template, generateTemplate, updateTemplate, validate, buildFinalPayload, resetAll,
        firstPageDetails, lastPageDetails,
        firstSurah, setFirstSurah, lastSurah, setLastSurah,
        firstAyah, setFirstAyah, lastAyah, setLastAyah,
        getValidAyahs
    };
}