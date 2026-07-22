export const fontFamily = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    boldItalic: 'Inter_700Bold_Italic',
};

export function textStyle(weight = 'regular', size = 15, color) {
    const map = {
        regular: fontFamily.regular,
        medium: fontFamily.medium,
        semibold: fontFamily.semibold,
        bold: fontFamily.bold,
    };
    return {
        fontFamily: map[weight] || fontFamily.regular,
        fontSize: size,
        ...(color ? { color } : {}),
    };
}
