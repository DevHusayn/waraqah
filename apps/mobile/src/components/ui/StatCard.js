import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../../theme';

/** Compact horizontal summary tile — not a large card */
export function StatTile({ label, value }) {
    return (
        <View style={styles.tile}>
            <Text style={styles.label} numberOfLines={1}>
                {label}
            </Text>
            <Text style={styles.value} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

export function StatStrip({ items = [] }) {
    return (
        <View style={styles.strip}>
            {items.map((item, index) => (
                <View key={item.label} style={[styles.cell, index < items.length - 1 && styles.cellBorder]}>
                    <StatTile label={item.label} value={item.value} />
                </View>
            ))}
        </View>
    );
}

/** @deprecated Prefer StatTile / StatStrip for mobile density */
export function StatCard({ label, value, icon: Icon, theme = 'brand' }) {
    return (
        <View style={styles.legacyCard}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    strip: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radii.xl,
        paddingVertical: spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    cell: {
        flex: 1,
        paddingHorizontal: spacing.sm,
    },
    cellBorder: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: colors.border,
    },
    tile: {
        alignItems: 'center',
        gap: 4,
    },
    label: {
        fontFamily: fontFamily.medium,
        fontSize: 11,
        color: colors.muted,
        textAlign: 'center',
    },
    value: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.md,
        fontWeight: '700',
        color: colors.foreground,
        letterSpacing: -0.3,
        textAlign: 'center',
        lineHeight: lineHeight.md,
    },
    legacyCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
});
