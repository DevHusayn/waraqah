import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radii, shadows, spacing, statIconThemes } from '../../theme';
import { Card } from './Card';

export function StatCard({ label, value, icon: Icon, theme = 'brand' }) {
    const t = statIconThemes[theme] || statIconThemes.brand;
    return (
        <Card style={styles.stat} elevated>
            <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
                {Icon ? <Icon size={20} color={t.color} strokeWidth={2} /> : null}
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} numberOfLines={1}>
                {value}
            </Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    stat: {
        width: '47%',
        flexGrow: 1,
        ...shadows.soft,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    label: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.muted,
    },
    value: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        fontWeight: '700',
        color: colors.foreground,
        marginTop: 2,
    },
});
