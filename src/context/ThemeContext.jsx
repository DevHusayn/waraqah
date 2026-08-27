import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'waraqah_theme_mode';
const THEME_MODES = ['light', 'dark'];

function normalizeThemeMode(value) {
    return THEME_MODES.includes(value) ? value : 'dark';
}

function readStoredThemeMode() {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        const mode = normalizeThemeMode(stored);
        if (stored !== mode) {
            localStorage.setItem(THEME_KEY, mode);
        }
        return mode;
    } catch {
        return 'dark';
    }
}

function applyThemeClass(resolvedTheme) {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [themeMode, setThemeModeState] = useState(readStoredThemeMode);

    useEffect(() => {
        applyThemeClass(themeMode);
    }, [themeMode]);

    const setThemeMode = useCallback((mode) => {
        const next = normalizeThemeMode(mode);
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch {
            // ignore storage failures
        }
        setThemeModeState(next);
    }, []);

    const toggleThemeMode = useCallback(() => {
        setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }, [themeMode, setThemeMode]);

    const value = useMemo(
        () => ({
            themeMode,
            setThemeMode,
            toggleThemeMode,
            cycleThemeMode: toggleThemeMode,
            resolvedTheme: themeMode,
            isDark: themeMode === 'dark',
        }),
        [themeMode, setThemeMode, toggleThemeMode],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
