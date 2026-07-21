import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/appStore';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export function OfflineBanner() {
    const isOffline = useAppStore((s) => s.isOffline);
    const insets = useSafeAreaInsets();

    if (!isOffline) return null;

    return (
        <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(180)}
            style={[styles.banner, { paddingTop: Math.max(insets.top, spacing.sm) }]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
        >
            <View style={styles.row}>
                <WifiOff size={14} color={colors.white} strokeWidth={2.5} />
                <Text style={styles.text}>You're offline — showing cached data when available</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: colors.slate900,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        color: colors.white,
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
    },
});
