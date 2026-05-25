// C:\quran-similarity-app\frontend\src\shared\services\themeApi.js
import { API_BASE, getAuthHeader, handleResponse, handleApiError } from './apiConfig';

export const getCurrentTheme = async () => {
    try {
        const res = await fetch(`${API_BASE}/themes/current`, { headers: getAuthHeader() });
        return await handleResponse(res);
    } catch (err) { return handleApiError(err, 'Get current theme'); }
};

export const getAllThemes = async () => {
    try {
        const res = await fetch(`${API_BASE}/themes/all`, { headers: getAuthHeader() });
        return await handleResponse(res);
    } catch (err) { return handleApiError(err, 'Get themes'); }
};

export const selectTheme = async (themeId) => {
    try {
        const res = await fetch(`${API_BASE}/themes/select`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ theme_id: themeId })
        });
        return await handleResponse(res);
    } catch (err) { return handleApiError(err, 'Select theme'); }
};

export const checkPreview = async () => {
    try {
        const res = await fetch(`${API_BASE}/themes/preview`, { headers: getAuthHeader() });
        return await handleResponse(res);
    } catch (err) { return handleApiError(err, 'Check preview'); }
};