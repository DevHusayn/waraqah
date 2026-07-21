import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '../../theme';

function ShimmerBlock({ width, height, style }) {
    const opacity = useSharedValue(0.35);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.85, { duration: 800, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
    }, [opacity]);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return <Animated.View style={[styles.block, { width, height }, animStyle, style]} />;
}

export function SkeletonCard() {
    return (
        <View style={styles.card}>
            <ShimmerBlock width="40%" height={10} />
            <ShimmerBlock width="70%" height={16} style={{ marginTop: spacing.sm }} />
        </View>
    );
}

export function SkeletonList({ count = 5 }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} style={[styles.listRow, i < count - 1 && styles.listBorder]}>
                    <View style={{ flex: 1, gap: 8 }}>
                        <ShimmerBlock width="45%" height={14} />
                        <ShimmerBlock width="65%" height={11} />
                    </View>
                    <ShimmerBlock width={56} height={14} />
                </View>
            ))}
        </View>
    );
}

export function PageLoader() {
    return (
        <View style={styles.page}>
            <ShimmerBlock width="55%" height={28} style={{ marginBottom: spacing.sm }} />
            <ShimmerBlock width="35%" height={14} style={{ marginBottom: spacing.xxl }} />
            <View style={styles.strip}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </View>
            <SkeletonList count={5} />
        </View>
    );
}

const styles = StyleSheet.create({
    block: {
        backgroundColor: colors.slate200,
        borderRadius: radii.sm,
    },
    card: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    listBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderLight,
    },
    page: {
        flex: 1,
        paddingTop: spacing.xxl,
        backgroundColor: colors.surfaceMuted,
    },
    strip: {
        flexDirection: 'row',
        marginHorizontal: spacing.xl,
        marginBottom: spacing.xxl,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radii.xl,
        paddingVertical: spacing.sm,
    },
});
