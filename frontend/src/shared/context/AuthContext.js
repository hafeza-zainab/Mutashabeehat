// C:\quran-similarity-app\frontend\src\shared\context\AuthContext.js
// Fix #7: on mount, decode the stored JWT's `exp` field and call logout()
//         immediately if it has expired. This prevents a user appearing
//         logged-in with a dead token until the first API call returns 401.

import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

/**
 * Decode the payload of a JWT without verifying its signature.
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        // Replace URL-safe chars, pad to 4-byte boundary
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonStr = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

/**
 * Returns true if the token exists and its exp claim is in the future.
 */
function isTokenValid(token) {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;
    // exp is in seconds; Date.now() is milliseconds
    return payload.exp * 1000 > Date.now();
}

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user,  setUser]  = useState(null);

    // Fix #7: validate stored token on mount and whenever token changes
    useEffect(() => {
        if (token && isTokenValid(token)) {
            setUser({ username: localStorage.getItem('username') });
        } else {
            // Token missing or expired — clear everything
            if (token) {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setToken(null);
            }
            setUser(null);
        }
    }, [token]);

    // Fix #7: also schedule an automatic logout when the token expires
    useEffect(() => {
        if (!token) return;
        const payload = decodeJwtPayload(token);
        if (!payload?.exp) return;

        const msUntilExpiry = payload.exp * 1000 - Date.now();
        if (msUntilExpiry <= 0) return; // already handled by the effect above

        const id = setTimeout(() => {
            console.info('[Auth] Token expired — logging out automatically.');
            logout(); // eslint-disable-line no-use-before-define
        }, msUntilExpiry);

        return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const login = (newToken, username) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('username', username);
        setToken(newToken);
        // user state is derived in the first useEffect
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);