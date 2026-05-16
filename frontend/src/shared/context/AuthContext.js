//C:\quran-similarity-app\frontend\src\shared\context\AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    useEffect(() => { if (token) setUser({ username: localStorage.getItem('username') }); else setUser(null); }, [token]);
    const login = (token, username) => { localStorage.setItem('token', token); localStorage.setItem('username', username); setToken(token); setUser({ username }); };
    const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('username'); setToken(null); setUser(null); };
    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
export const useAuthContext = () => React.useContext(AuthContext);