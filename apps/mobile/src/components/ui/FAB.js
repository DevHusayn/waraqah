import { Pressable, StyleSheet, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize, radii, shadows, spacing } from '../../theme';
import { hapticLight } from '../../utils/haptics';

export function FAB({ onPress, label, icon: Icon = Plus, style }) {
    const insets = useSafeAreaInsets();
    return (
        <Pressable
            onPress={() => {
                hapticLight();
                onPress?.();
            }}
            style={({ pressed }) => [
                styles.fab,
                shadows.fab,
                { bottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
                pressed && styles.pressed,
                style,
            ]}
            accessibilityRole="button"
            accessibilityLabel={label || 'Create'}
        >
            <Icon size={22} color={colors.white} strokeWidth={2.5} />
            {label ? <Text style={styles.label}>{label}</Text> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.brand,
        minHeight: 52,
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.full,
        zIndex: 10,
    },
    pressed: {
        opacity: 0.92,
        transform: [{ scale: 0.97 }],
    },
    label: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.white,
        fontWeight: '600',
    },
});
