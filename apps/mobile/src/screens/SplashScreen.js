import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';
import { colors, fontFamily, fontSize, spacing } from '../theme';

const REST_WIDTH = 132;
const SPLASH_DURATION_MS = 2600;

export function SplashScreen({ onFinish }) {
    const wOpacity = useSharedValue(0);
    const wScale = useSharedValue(0.92);
    const restWidth = useSharedValue(0);
    const restOpacity = useSharedValue(0);
    const restTranslateX = useSharedValue(8);

    useEffect(() => {
        wOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
        wScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });

        restWidth.value = withDelay(
            450,
            withTiming(REST_WIDTH, { duration: 600, easing: Easing.out(Easing.cubic) })
        );
        restOpacity.value = withDelay(
            450,
            withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
        );
        restTranslateX.value = withDelay(
            450,
            withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
        );

        const timer = setTimeout(() => onFinish?.(), SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, [onFinish, restOpacity, restTranslateX, restWidth, wOpacity, wScale]);

    const wStyle = useAnimatedStyle(() => ({
        opacity: wOpacity.value,
        transform: [{ scale: wScale.value }],
    }));

    const restClipStyle = useAnimatedStyle(() => ({
        width: restWidth.value,
        opacity: restOpacity.value,
    }));

    const restStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: restTranslateX.value }],
    }));

    return (
        <View style={styles.root} accessibilityLabel={`${APP_NAME} splash screen`}>
            <StatusBar style="light" />
            <View style={styles.center}>
                <View style={styles.wordmarkRow}>
                    <Animated.Text style={[styles.letter, wStyle]}>W</Animated.Text>
                    <Animated.View style={[styles.restClip, restClipStyle]}>
                        <Animated.Text style={[styles.letter, restStyle]}>araqah</Animated.Text>
                    </Animated.View>
                </View>
                <Animated.Text entering={FadeIn.delay(900).duration(500)} style={styles.tagline}>
                    {APP_TAGLINE}
                </Animated.Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    wordmarkRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    letter: {
        fontFamily: fontFamily.brand,
        fontSize: 40,
        color: colors.white,
        letterSpacing: -0.6,
    },
    restClip: {
        overflow: 'hidden',
    },
    tagline: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
    },
});
