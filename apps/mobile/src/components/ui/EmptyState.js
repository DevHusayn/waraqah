import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../../theme';
import { Button } from './Button';

export function EmptyState({ title, message, action, actionLabel, onAction, icon: Icon }) {
    return (
        <View style={styles.wrap} accessibilityRole="summary">
            {Icon ? (
                <View style={styles.iconWrap}>
                    <Icon size={28} color={colors.slate400} strokeWidth={1.75} />
                </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {actionLabel && onAction ? (
                <Button title={actionLabel} onPress={onAction} style={styles.cta} />
            ) : (
                action
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        paddingVertical: spacing.huge,
        paddingHorizontal: spacing.xxl,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: radii.xxl,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    title: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: spacing.sm,
    },
    message: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        textAlign: 'center',
        lineHeight: lineHeight.md,
        maxWidth: 280,
        marginBottom: spacing.xl,
    },
    cta: {
        minWidth: 180,
        marginTop: spacing.sm,
    },
});
