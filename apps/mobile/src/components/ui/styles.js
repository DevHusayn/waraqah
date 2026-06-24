import { StyleSheet } from 'react-native';
import { colors, radii, spacing, fontSize, fontWeight, fontFamily } from '../../theme';

export const baseStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.surfaceMuted,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginTop: spacing.xs,
        lineHeight: 18,
    },
    label: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.slate700,
        marginBottom: 6,
    },
    required: {
        color: colors.red600,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: 14,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        fontFamily: fontFamily.regular,
        color: colors.foreground,
        backgroundColor: colors.surface,
    },
    inputError: {
        borderColor: '#f87171',
    },
    fieldError: {
        fontFamily: fontFamily.regular,
        color: colors.red600,
        fontSize: fontSize.xs,
        marginTop: spacing.xs,
    },
    button: {
        borderRadius: radii.md,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: colors.brand,
    },
    buttonSecondary: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    buttonDanger: {
        backgroundColor: colors.red50,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    buttonDisabled: {
        opacity: 0.55,
    },
    buttonPressed: {
        opacity: 0.88,
    },
    buttonText: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    buttonTextPrimary: {
        color: colors.white,
    },
    buttonTextSecondary: {
        color: colors.slate700,
    },
    buttonTextDanger: {
        color: colors.red700,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    badgeText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing.sm,
    },
    emptyMessage: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        textAlign: 'center',
    },
});
