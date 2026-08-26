import { createContext, useCallback, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
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
    const systemScheme = useColorScheme();

    const resolvedTheme = useMemo(
        () => resolveThemeMode(themeMode, systemScheme),
        [themeMode, systemScheme],
    );
    const prefersDark = systemScheme === 'dark';
    const oppositeOfSystem = prefersDark ? 'light' : 'dark';

    const toggleThemeMode = useCallback(() => {
        setThemeMode(themeMode === 'system' ? oppositeOfSystem : 'system');
    }, [themeMode, oppositeOfSystem, setThemeMode]);

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
            prefersDark,
            oppositeOfSystem,
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
            prefersDark,
            oppositeOfSystem,
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
