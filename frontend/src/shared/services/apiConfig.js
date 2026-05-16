//C:\quran-similarity-app\frontend\src\shared\services\apiConfig.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const handleResponse = async (res) => {
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            if (window.location.pathname !== '/login') window.location.href = '/login';
            throw new Error('Session expired. Please login again.');
        }
        throw new Error('Backend is not responding.');
    }
    return await res.json();
};

const handleApiError = (error, context = 'API call') => {
    console.error(`${context} failed:`, error);
    if (error.message === 'Failed to fetch' || error.message.includes('Backend is not responding')) {
        return { success: false, message: 'Network error: Is the backend server running on port 5000?' };
    }
    return { success: false, message: error.message || 'An unexpected error occurred' };
};

export { API_BASE, getAuthHeader, handleResponse, handleApiError };