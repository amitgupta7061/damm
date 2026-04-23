"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate from localStorage on boot
        const storedToken = localStorage.getItem('collabdraw_token');
        const storedUser = localStorage.getItem('collabdraw_user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('collabdraw_token', newToken);
        localStorage.setItem('collabdraw_user', JSON.stringify(userData));
        
        // Also set the old sync parameter just so rooms don't ask
        sessionStorage.setItem("collabdraw-username", userData.name);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('collabdraw_token');
        localStorage.removeItem('collabdraw_user');
        sessionStorage.removeItem("collabdraw-username");
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
