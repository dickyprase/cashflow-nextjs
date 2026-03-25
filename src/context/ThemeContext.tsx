"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    type ThemeId,
    type ColorScheme,
    getTheme,
    getColorScheme,
    darkModeOverrides,
    THEMES,
} from '@/themes';

interface ThemeState {
    theme: ThemeId;
    colorScheme: string;
    darkMode: boolean;
}

interface ThemeContextType extends ThemeState {
    setTheme: (theme: ThemeId) => void;
    setColorScheme: (schemeId: string) => void;
    toggleDarkMode: () => void;
    availableThemes: typeof THEMES;
}

const STORAGE_KEY = 'cashflow-theme';

const defaultState: ThemeState = {
    theme: 'default',
    colorScheme: 'emerald',
    darkMode: false,
} as const;

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}

function loadState(): ThemeState {
    if (typeof window === 'undefined') return { ...defaultState };

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return { ...defaultState, ...parsed };
        }
        // Migrate from old dark mode setting
        const oldSettings = localStorage.getItem('cashflow-settings');
        if (oldSettings) {
            const old = JSON.parse(oldSettings);
            if (old.darkMode) {
                return { ...defaultState, darkMode: true };
            }
        }
    } catch { /* ignore */ }
    return { ...defaultState };
}

function applyThemeToDOM(state: ThemeState) {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const themeDef = getTheme(state.theme);
    const scheme: ColorScheme = getColorScheme(themeDef, state.colorScheme);

    // 1. Apply CSS variables from the color scheme
    Object.entries(scheme.vars).forEach(([prop, value]) => {
        html.style.setProperty(prop, value);
    });

    // 2. Apply dark mode overrides if applicable
    if (state.darkMode && themeDef.supportsDarkMode) {
        Object.entries(darkModeOverrides).forEach(([prop, value]) => {
            html.style.setProperty(prop, value);
        });
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    // 3. Toggle theme classes
    html.classList.remove('theme-default', 'theme-neo-brutalism');
    html.classList.add(`theme-${state.theme}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ThemeState>(loadState);

    // Apply theme whenever state changes
    useEffect(() => {
        applyThemeToDOM(state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Also keep old key in sync for backward compat
        localStorage.setItem('cashflow-settings', JSON.stringify({ darkMode: state.darkMode }));
    }, [state]);

    const setTheme = useCallback((theme: ThemeId) => {
        setState((prev) => {
            const themeDef = getTheme(theme);
            const firstScheme = themeDef.colorSchemes[0].id;
            const darkMode = themeDef.supportsDarkMode ? prev.darkMode : false;
            return { theme, colorScheme: firstScheme, darkMode };
        });
    }, []);

    const setColorScheme = useCallback((schemeId: string) => {
        setState((prev) => ({ ...prev, colorScheme: schemeId }));
    }, []);

    const toggleDarkMode = useCallback(() => {
        setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                ...state,
                setTheme,
                setColorScheme,
                toggleDarkMode,
                availableThemes: THEMES,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}
