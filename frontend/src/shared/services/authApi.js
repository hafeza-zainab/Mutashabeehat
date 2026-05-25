//C:\quran-similarity-app\frontend\src\shared\services\authApi.js
import { API_BASE, handleResponse, handleApiError } from './apiConfig';
export const signupUser = async (username, email, password) => {
    try {
        const res = await fetch(`${API_BASE}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
        return await handleResponse(res);
    } catch (error) { return handleApiError(error, 'Signup'); }
};
export const loginUser = async (email, password) => {
    try {
        const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        return await handleResponse(res);
    } catch (error) { return handleApiError(error, 'Login'); }
};