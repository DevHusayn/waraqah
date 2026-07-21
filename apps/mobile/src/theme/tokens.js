/** 8-point spacing system — use 16 / 20 / 24 for screen padding */
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
};

export const screenPadding = {
    x: spacing.xl, // 20
    y: spacing.xxl, // 24
};

export const radii = {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 20,
    full: 9999,
};

export const fontSize = {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 28,
    display: 32,
};

export const lineHeight = {
    xs: 16,
    sm: 18,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 34,
    display: 38,
};

export const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
};

/** Minimum touch target */
export const touchTarget = 44;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
