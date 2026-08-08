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
import { WaraqahLogo } from '../components/WaraqahLogo';
import { APP_TAGLINE } from '../constants/brand';
import { colors, fontFamily, fontSize, spacing } from '../theme';

const SPLASH_DURATION_MS = 2600;

export function SplashScreen({ onFinish }) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.92);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
        scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });

        const timer = setTimeout(() => onFinish?.(), SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, [onFinish, opacity, scale]);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.root} accessibilityLabel="Waraqah splash screen">
            <StatusBar style="light" />
            <View style={styles.center}>
                <Animated.View style={logoStyle}>
                    <WaraqahLogo size="lg" inverted />
                </Animated.View>
                <Animated.Text entering={FadeIn.delay(650).duration(500)} style={styles.tagline}>
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
    tagline: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
    },
});
