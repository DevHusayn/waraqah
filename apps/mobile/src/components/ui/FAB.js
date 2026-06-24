import { Pressable, StyleSheet, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, fontFamily, fontSize, radii, shadows, spacing } from '../../theme';
import { hapticLight } from '../../utils/haptics';

export function FAB({ onPress, label, icon: Icon = Plus, style }) {
    return (
        <Pressable
            onPress={() => {
                hapticLight();
                onPress?.();
            }}
            style={({ pressed }) => [styles.fab, shadows.fab, pressed && styles.pressed, style]}
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
        right: spacing.lg,
        bottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.brand,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.full,
        zIndex: 10,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    label: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.white,
        fontWeight: '600',
    },
});
