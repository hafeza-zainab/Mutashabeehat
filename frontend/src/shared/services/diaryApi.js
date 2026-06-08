// C:\quran-similarity-app\frontend\src\shared\services\diaryApi.js

import { API_BASE, getAuthHeader, handleResponse, handleApiError } from './apiConfig';

export const addLog = async (payload, type) => {
    try {
        const res = await fetch(`${API_BASE}/diary/${type}`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(payload)
        });
        const data = await handleResponse(res);
        console.log(`[DIARY SAVE] Type: ${type}, Status:`, res.status, data);
        return data;
    } catch (error) {
        console.error(`[DIARY ERROR] Type: ${type}`, error);
        return handleApiError(error, 'Save log');
    }
};

export const getLogs = async (date) => {
    try {
        const res = await fetch(`${API_BASE}/diary/logs?date=${date}`, { headers: getAuthHeader() });
        return await handleResponse(res);
    } catch (error) { return handleApiError(error, 'Fetch logs'); }
};

export const deleteLog = async (id) => {
    try {
        const res = await fetch(`${API_BASE}/diary/log/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        return await handleResponse(res);
    } catch (error) { return handleApiError(error, 'Delete log'); }
};

export const updateLog = async (id, data) => {
    try {
        const res = await fetch(`${API_BASE}/diary/log/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data)
        });
        return await handleResponse(res);
    } catch (error) { return handleApiError(error, 'Update log'); }
};