import { StyleSheet } from 'react-native';
import { colors, radii, spacing, fontSize, fontWeight, fontFamily, lineHeight, touchTarget } from '../../theme';

export const baseStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    screenMuted: {
        flex: 1,
        backgroundColor: colors.surfaceMuted,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.huge,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        padding: spacing.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        letterSpacing: -0.6,
        lineHeight: lineHeight.xxl,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        marginTop: spacing.sm,
        lineHeight: lineHeight.md,
    },
    sectionLabel: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        color: colors.slate400,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        marginBottom: spacing.md,
    },
    label: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.slate600,
        marginBottom: spacing.sm,
    },
    required: {
        color: colors.red600,
    },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        minHeight: touchTarget + 8,
        fontSize: fontSize.md,
        fontFamily: fontFamily.regular,
        color: colors.foreground,
        backgroundColor: colors.surfaceMuted,
    },
    inputError: {
        borderColor: colors.red600,
        backgroundColor: colors.red50,
    },
    fieldError: {
        fontFamily: fontFamily.regular,
        color: colors.red600,
        fontSize: fontSize.xs,
        marginTop: spacing.sm,
        lineHeight: lineHeight.xs,
    },
    button: {
        borderRadius: radii.md,
        minHeight: 52,
        paddingVertical: 14,
        paddingHorizontal: spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    buttonPrimary: {
        backgroundColor: colors.brand,
    },
    buttonSecondary: {
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    buttonDanger: {
        backgroundColor: colors.red600,
    },
    buttonGhost: {
        backgroundColor: 'transparent',
    },
    buttonDisabled: {
        opacity: 0.45,
    },
    buttonPressed: {
        transform: [{ scale: 0.985 }],
        opacity: 0.92,
    },
    buttonText: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        letterSpacing: -0.1,
    },
    buttonTextPrimary: {
        color: colors.white,
    },
    buttonTextSecondary: {
        color: colors.foreground,
    },
    buttonTextDanger: {
        color: colors.white,
    },
    buttonTextGhost: {
        color: colors.brand,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.sm,
    },
    badgeText: {
        fontFamily: fontFamily.semibold,
        fontSize: 11,
        fontWeight: fontWeight.semibold,
        letterSpacing: 0.2,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: spacing.huge,
        paddingHorizontal: spacing.xxl,
    },
    emptyTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing.sm,
        textAlign: 'center',
        letterSpacing: -0.2,
    },
    emptyMessage: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        textAlign: 'center',
        lineHeight: lineHeight.md,
        maxWidth: 280,
    },
    hairline: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },
});
