import { createContext, useCallback, useContext, useMemo } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAppStore } from '../stores/appStore';
import {
    getStatIconThemes,
    getThemeColors,
    resolveThemeMode,
} from './colors';

const ThemeContext = createContext(null);

function buildNavigationTheme(colors, isDark) {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
        ...base,
        colors: {
            ...base.colors,
            primary: colors.brand,
            background: colors.surface,
            card: colors.surface,
            text: colors.foreground,
            border: colors.border,
            notification: colors.brand,
        },
    };
}

export function ThemeProvider({ children }) {
    const themeMode = useAppStore((s) => s.themeMode);
    const setThemeMode = useAppStore((s) => s.setThemeMode);

    const resolvedTheme = useMemo(() => resolveThemeMode(themeMode), [themeMode]);

    const toggleThemeMode = useCallback(() => {
        setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }, [themeMode, setThemeMode]);

    const colors = useMemo(() => getThemeColors(resolvedTheme), [resolvedTheme]);
    const statIconThemes = useMemo(() => getStatIconThemes(colors), [colors]);
    const navigationTheme = useMemo(
        () => buildNavigationTheme(colors, resolvedTheme === 'dark'),
        [colors, resolvedTheme],
    );

    const value = useMemo(
        () => ({
            themeMode,
            setThemeMode,
            toggleThemeMode,
            resolvedTheme,
            isDark: resolvedTheme === 'dark',
            colors,
            statIconThemes,
            navigationTheme,
        }),
        [
            themeMode,
            setThemeMode,
            toggleThemeMode,
            resolvedTheme,
            colors,
            statIconThemes,
            navigationTheme,
        ],
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
