export const lightColors = {
    brand: '#16A34A',
    brandDark: '#15803D',
    brandLight: '#DCFCE7',
    brandSubtle: '#F0FDF4',
    brandSecondary: '#86EFAC',
    surface: '#FFFFFF',
    surfaceMuted: '#F8FAFC',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    muted: '#64748B',
    foreground: '#0F172A',
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate900: '#0F172A',
    white: '#FFFFFF',
    red50: '#FEF2F2',
    red600: '#DC2626',
    red700: '#B91C1C',
    green50: '#F0FDF4',
    green600: '#16A34A',
    amber50: '#FFFBEB',
    amber600: '#F59E0B',
    violet50: '#F5F3FF',
    violet600: '#7C3AED',
    mint: '#86EFAC',
    info: '#22C55E',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    overlay: 'rgba(15, 23, 42, 0.4)',
};

export const darkColors = {
    brand: '#22C55E',
    brandDark: '#16A34A',
    brandLight: '#14532D',
    brandSubtle: '#052E16',
    brandSecondary: '#166534',
    surface: '#0F172A',
    surfaceMuted: '#1E293B',
    border: '#334155',
    borderLight: '#475569',
    muted: '#94A3B8',
    foreground: '#F8FAFC',
    slate50: '#1E293B',
    slate100: '#334155',
    slate200: '#475569',
    slate300: '#64748B',
    slate400: '#94A3B8',
    slate500: '#CBD5E1',
    slate600: '#E2E8F0',
    slate700: '#F1F5F9',
    slate900: '#F8FAFC',
    white: '#FFFFFF',
    red50: '#450A0A',
    red600: '#F87171',
    red700: '#FCA5A5',
    green50: '#052E16',
    green600: '#4ADE80',
    amber50: '#451A03',
    amber600: '#FBBF24',
    violet50: '#2E1065',
    violet600: '#A78BFA',
    mint: '#86EFAC',
    info: '#4ADE80',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    overlay: 'rgba(0, 0, 0, 0.55)',
};

/** @deprecated Use useTheme().colors instead */
export const colors = lightColors;

export function getStatIconThemes(palette) {
    return {
        brand: { bg: palette.brandLight, color: palette.brand },
        violet: { bg: palette.violet50, color: palette.violet600 },
        revenue: { bg: palette.green50, color: palette.green600 },
        amber: { bg: palette.amber50, color: palette.amber600 },
    };
}

export const statIconThemes = getStatIconThemes(lightColors);

export function resolveThemeMode(themeMode, systemScheme) {
    if (themeMode === 'dark') return 'dark';
    if (themeMode === 'light') return 'light';
    return systemScheme === 'dark' ? 'dark' : 'light';
}

export function getThemeColors(resolvedTheme) {
    return resolvedTheme === 'dark' ? darkColors : lightColors;
}
