"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '@/services/api';
import type { User, LoginPayload, RegisterPayload } from '@/types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('cashflow-token');
        const savedUser = localStorage.getItem('cashflow-user');
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('cashflow-token');
                localStorage.removeItem('cashflow-user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (payload: LoginPayload) => {
        const res = await api.post('/auth/login', payload);
        const { token, user: userData } = res.data.data;
        localStorage.setItem('cashflow-token', token);
        localStorage.setItem('cashflow-user', JSON.stringify(userData));
        setUser(userData);
    };

    const register = async (payload: RegisterPayload) => {
        const res = await api.post('/auth/register', payload);
        const { token, user: userData } = res.data.data;
        localStorage.setItem('cashflow-token', token);
        localStorage.setItem('cashflow-user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('cashflow-token');
        localStorage.removeItem('cashflow-user');
        setUser(null);
    };

    const updateUser = (updated: User) => {
        localStorage.setItem('cashflow-user', JSON.stringify(updated));
        setUser(updated);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'admin',
                loading,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
