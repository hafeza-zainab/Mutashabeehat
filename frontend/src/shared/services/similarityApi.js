// C:\quran-similarity-app\frontend\src\shared\services\similarityApi.js
// Fix #4: fetchJuzPages was calling /ayah/juzz-pages (double-z) but the
//          backend route is /ayah/juz-pages (single-z). Fixed throughout.
// Fix #13: API_BASE imported from the single source of truth (apiConfig).

import { API_BASE, handleResponse, handleApiError } from './apiConfig';

export const fetchSurahs = async () => {
    try {
        const res  = await fetch(`${API_BASE}/ayah/surahs`);
        const data = await handleResponse(res);
        return data.data || [];
    } catch (error) {
        console.error('Failed to fetch surahs:', error);
        return [];
    }
};

export const fetchAyahs = async (surah) => {
    try {
        const res  = await fetch(`${API_BASE}/ayah/${surah}/ayahs`);
        const data = await handleResponse(res);
        return data.data || [];
    } catch (error) {
        console.error('Failed to fetch ayahs:', error);
        return [];
    }
};

export const fetchSimilarities = async (surah, ayah, marhala = '', juz = '', page = '') => {
    try {
        const params = new URLSearchParams({ surah, ayah });
        if (marhala) params.append('marhala', marhala);
        if (juz)     params.append('juz', juz);
        if (page)    params.append('page', page);
        const res = await fetch(`${API_BASE}/similarity?${params.toString()}`);
        return await handleResponse(res);
    } catch (error) {
        return handleApiError(error, 'Fetch similarities');
    }
};

export const fetchAyahContext = async (surah, ayah) => {
    try {
        const res = await fetch(`${API_BASE}/ayah/context?surah=${surah}&ayah=${ayah}`);
        return await handleResponse(res);
    } catch (error) {
        return handleApiError(error, 'Fetch context');
    }
};

export const fetchPageDetails = async (page) => {
    try {
        const res  = await fetch(`${API_BASE}/ayah/page-details?page=${page}`);
        const data = await handleResponse(res);
        return data.data || null;
    } catch (error) {
        console.error('Failed to fetch page details:', error);
        return null;
    }
};

// Fix #4: was /ayah/juzz-pages — corrected to /ayah/juz-pages (single z)
export const fetchJuzPages = async (juz) => {
    try {
        const res  = await fetch(`${API_BASE}/ayah/juz-pages?juz=${juz}`);
        const data = await handleResponse(res);
        return data.data || [];
    } catch (error) {
        console.error('Failed to fetch juz pages:', error);
        return [];
    }
};

export const fetchPagesInRange = async (start, end) => {
    try {
        const res  = await fetch(`${API_BASE}/ayah/pages-in-range?start=${start}&end=${end}`);
        const data = await handleResponse(res);
        return data.data || [];
    } catch (error) {
        console.error('Failed to fetch pages in range:', error);
        return [];
    }
};