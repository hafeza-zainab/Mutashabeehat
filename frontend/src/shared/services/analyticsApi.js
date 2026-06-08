// shared/services/analyticsApi.js
import { API_BASE, getAuthHeader, handleApiError } from './apiConfig';

export const getTrend = async (range, customStart, customEnd) => {
    try {
        const params = new URLSearchParams();
        if (customStart && customEnd) {
            params.append('start', customStart);
            params.append('end', customEnd);
        } else {
            params.append('range', range || '7d');
        }
        const res = await fetch(`${API_BASE}/analytics/trend?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return await res.json();
    } catch (error) {
        return handleApiError(error, 'Fetch trend');
    }
};

export const getDeepDive = async (type, juz, range) => {
    try {
        const params = new URLSearchParams({ type });
        if (juz)   params.append('juz', juz);
        if (range) params.append('range', range);
        const res = await fetch(`${API_BASE}/analytics/deep-dive?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return await res.json();
    } catch (error) {
        return handleApiError(error, 'Fetch deep dive');
    }
};

export const getHeatmapData = async () => {
    try {
        const res = await fetch(`${API_BASE}/analytics/heatmap`, {
            headers: getAuthHeader(),
        });
        return await res.json();
    } catch (error) {
        return handleApiError(error, 'Fetch heatmap');
    }
};