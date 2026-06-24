import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';

function SkeletonBlock({ width, height, style }) {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.block,
                { width, height, opacity },
                style,
            ]}
        />
    );
}

export function SkeletonCard() {
    return (
        <View style={styles.card}>
            <SkeletonBlock width={36} height={36} style={{ borderRadius: radii.md }} />
            <SkeletonBlock width="60%" height={12} style={{ marginTop: spacing.sm }} />
            <SkeletonBlock width="40%" height={20} style={{ marginTop: spacing.sm }} />
        </View>
    );
}

export function SkeletonList({ count = 3 }) {
    return (
        <View style={{ gap: spacing.sm }}>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} style={styles.listRow}>
                    <SkeletonBlock width="70%" height={14} />
                    <SkeletonBlock width="30%" height={12} style={{ marginTop: 6 }} />
                </View>
            ))}
        </View>
    );
}

export function PageLoader() {
    return (
        <View style={styles.page}>
            <View style={styles.statsRow}>
                <SkeletonCard />
                <SkeletonCard />
            </View>
            <SkeletonList count={4} />
        </View>
    );
}

const styles = StyleSheet.create({
    block: {
        backgroundColor: colors.slate200,
        borderRadius: radii.sm,
    },
    card: {
        width: '47%',
        flexGrow: 1,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    listRow: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    page: {
        flex: 1,
        padding: spacing.lg,
        backgroundColor: colors.surfaceMuted,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
});
