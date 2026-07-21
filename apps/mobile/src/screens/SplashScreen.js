import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';
import { colors, fontFamily, fontSize, radii, spacing } from '../theme';

export function SplashScreen({ onFinish }) {
    const scale = useSharedValue(0.88);
    const opacity = useSharedValue(0);
    const glow = useSharedValue(0.35);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
        scale.value = withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) });
        glow.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 900 }),
                withTiming(0.35, { duration: 900 })
            ),
            -1,
            false
        );

        const timer = setTimeout(() => onFinish?.(), 1800);
        return () => clearTimeout(timer);
    }, [glow, onFinish, opacity, scale]);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glow.value,
    }));

    return (
        <View style={styles.root} accessibilityLabel={`${APP_NAME} splash screen`}>
            <View style={styles.atmosphere} />
            <Animated.View style={[styles.glow, glowStyle]} />
            <Animated.View style={[styles.center, logoStyle]}>
                <View style={styles.mark}>
                    <Text style={styles.markText}>W</Text>
                </View>
                <Text style={styles.name}>{APP_NAME}</Text>
                <Animated.Text entering={FadeIn.delay(400).duration(500)} style={styles.tagline}>
                    {APP_TAGLINE}
                </Animated.Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.brandSubtle,
        alignItems: 'center',
        justifyContent: 'center',
    },
    atmosphere: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.brandSubtle,
    },
    glow: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: colors.brandSecondary,
    },
    center: {
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    mark: {
        width: 72,
        height: 72,
        borderRadius: radii.xl,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.brand,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
        elevation: 8,
    },
    markText: {
        color: colors.white,
        fontFamily: fontFamily.bold,
        fontWeight: '800',
        fontSize: 34,
    },
    name: {
        fontFamily: fontFamily.bold,
        fontWeight: '800',
        fontSize: 34,
        color: colors.foreground,
        letterSpacing: -0.6,
    },
    tagline: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: colors.muted,
        textAlign: 'center',
    },
});
