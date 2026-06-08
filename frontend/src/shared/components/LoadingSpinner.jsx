//C:\quran-similarity-app\frontend\src\shared\components\LoadingSpinner.jsx
import React from 'react';
import '../styles/LoadingSpinner.css';
const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="loading-spinner-container">
        <div className="spinner"></div>
        <p>{message}</p>
    </div>
);
export default LoadingSpinner;