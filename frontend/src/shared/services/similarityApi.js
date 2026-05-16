//C:\quran-similarity-app\frontend\src\shared\services\similarityApi.js
import { API_BASE, handleResponse, handleApiError } from './apiConfig';
export const fetchSurahs = async () => { try { const res = await fetch(`${API_BASE}/ayah/surahs`); const data = await handleResponse(res); return data.data || []; } catch (error) { console.error('Failed to fetch surahs:', error); return []; } };
export const fetchAyahs = async (surah) => { try { const res = await fetch(`${API_BASE}/ayah/${surah}/ayahs`); const data = await handleResponse(res); return data.data || []; } catch (error) { console.error('Failed to fetch ayahs:', error); return []; } };
export const fetchSimilarities = async (surah, ayah, marhala = '', juzz = '', page = '') => {
    try {
        const params = new URLSearchParams({ surah, ayah });
        if (marhala) params.append('marhala', marhala);
        if (juzz) params.append('juzz', juzz);
        if (page) params.append('page', page);
        const res = await fetch(`${API_BASE}/similarity?${params.toString()}`);
        return await handleResponse(res);
    } catch (error) { return handleApiError(error, 'Fetch similarities'); }
};
export const fetchAyahContext = async (surah, ayah) => {
    try { const res = await fetch(`${API_BASE}/ayah/context?surah=${surah}&ayah=${ayah}`); return await handleResponse(res); } catch (error) { return handleApiError(error, 'Fetch context'); }
};
export const fetchPageDetails = async (page) => {
    try { const res = await fetch(`${API_BASE}/ayah/page-details?page=${page}`); const data = await handleResponse(res); return data.data || null; } catch (error) { console.error('Failed to fetch page details:', error); return null; }
};
export const fetchJuzzPages = async (juzz) => {
    try { const res = await fetch(`${API_BASE}/ayah/juzz-pages?juzz=${juzz}`); const data = await handleResponse(res); return data.data || []; } catch (error) { console.error('Failed to fetch juzz pages:', error); return []; }
};
export const fetchPagesInRange = async (start, end) => {
    try { const res = await fetch(`${API_BASE}/ayah/pages-in-range?start=${start}&end=${end}`); const data = await handleResponse(res); return data.data || []; } catch (error) { console.error('Failed to fetch pages in range:', error); return []; }
};