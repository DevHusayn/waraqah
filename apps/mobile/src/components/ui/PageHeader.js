import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '../../theme';

export function PageHeader({ title, subtitle, right, style, large = true }) {
    return (
        <View style={[styles.wrap, style]}>
            <View style={styles.row}>
                <View style={styles.text}>
                    <Text style={[styles.title, !large && styles.titleSm]} accessibilityRole="header">
                        {title}
                    </Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                {right}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.xl,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.lg,
    },
    text: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xxl,
        fontWeight: '700',
        color: colors.foreground,
        letterSpacing: -0.6,
        lineHeight: lineHeight.xxl,
    },
    titleSm: {
        fontSize: fontSize.xl,
        lineHeight: lineHeight.xl,
    },
    subtitle: {
        marginTop: spacing.sm,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        lineHeight: lineHeight.md,
    },
});
