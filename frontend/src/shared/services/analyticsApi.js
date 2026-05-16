import { API_BASE, getAuthHeader, handleApiError } from './apiConfig';

export const getTrend = async (range, customStart, customEnd) => {
    try {
        const params = new URLSearchParams();
        params.append('t', Date.now()); // Forces a completely unique URL to kill any cache
        if (customStart && customEnd) { params.append('start', customStart); params.append('end', customEnd); } else { params.append('range', range || '7d'); }
        
        const url = `${API_BASE}/analytics/trend?${params.toString()}`;
        console.log("[FETCH TREND] Calling URL:", url);
        
        const res = await fetch(url, { headers: getAuthHeader() });
        console.log("[FETCH TREND] Got Status:", res.status, res.statusText);
        
        const text = await res.text(); // Get raw text first
        console.log("[FETCH TREND] Got Raw Text (first 100 chars):", text.substring(0, 100));
        
        const json = JSON.parse(text); // Parse manually
        console.log("[FETCH TREND] Parsed JSON Data Length:", json.data?.length);
        
        return json; 
    } catch (error) { 
        console.log("[FETCH TREND] HARD ERROR:", error); 
        return handleApiError(error, 'Fetch trend'); 
    }
};

export const getDeepDive = async (type, juzz, range) => {
    try {
        const params = new URLSearchParams({ type, t: Date.now() });
        if (juzz) params.append('juzz', juzz); if (range) params.append('range', range);
        const res = await fetch(`${API_BASE}/analytics/deep-dive?${params.toString()}`, { headers: getAuthHeader() });
        return await res.json();
    } catch (error) { return handleApiError(error, 'Fetch deep dive'); }
};

export const getHeatmapData = async () => {
    try { 
        const res = await fetch(`${API_BASE}/analytics/heatmap?t=${Date.now()}`, { headers: getAuthHeader() }); 
        return await res.json(); 
    } catch (error) { return handleApiError(error, 'Fetch heatmap'); }
};