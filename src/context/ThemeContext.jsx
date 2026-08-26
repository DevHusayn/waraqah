import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'waraqah_theme_mode';
const THEME_MODES = ['system', 'light', 'dark'];

function readStoredThemeMode() {
    try {
        const stored = localStorage.getItem(THEME_KEY);
        return THEME_MODES.includes(stored) ? stored : 'system';
    } catch {
        return 'system';
    }
}

function resolveTheme(themeMode, prefersDark) {
    if (themeMode === 'dark') return 'dark';
    if (themeMode === 'light') return 'light';
    return prefersDark ? 'dark' : 'light';
}

function applyThemeClass(resolvedTheme) {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [themeMode, setThemeModeState] = useState(readStoredThemeMode);
    const [prefersDark, setPrefersDark] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const resolvedTheme = useMemo(
        () => resolveTheme(themeMode, prefersDark),
        [themeMode, prefersDark],
    );

    useEffect(() => {
        applyThemeClass(resolvedTheme);
    }, [resolvedTheme]);

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event) => setPrefersDark(event.matches);
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    const setThemeMode = useCallback((mode) => {
        if (!THEME_MODES.includes(mode)) return;
        try {
            localStorage.setItem(THEME_KEY, mode);
        } catch {
            // ignore storage failures
        }
        setThemeModeState(mode);
    }, []);

    const oppositeOfSystem = prefersDark ? 'light' : 'dark';

    const toggleThemeMode = useCallback(() => {
        setThemeMode(themeMode === 'system' ? oppositeOfSystem : 'system');
    }, [themeMode, oppositeOfSystem, setThemeMode]);

    const value = useMemo(
        () => ({
            themeMode,
            setThemeMode,
            toggleThemeMode,
            cycleThemeMode: toggleThemeMode,
            resolvedTheme,
            prefersDark,
            oppositeOfSystem,
            isDark: resolvedTheme === 'dark',
        }),
        [themeMode, setThemeMode, toggleThemeMode, resolvedTheme, prefersDark, oppositeOfSystem],
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
