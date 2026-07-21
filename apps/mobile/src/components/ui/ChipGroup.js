import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing, touchTarget } from '../../theme';
import { hapticSelection } from '../../utils/haptics';

export function ChipGroup({ options, value, onChange, style }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.row, style]}
        >
            {options.map((opt) => {
                const key = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                const active = value === key;
                return (
                    <Pressable
                        key={key}
                        onPress={() => {
                            hapticSelection();
                            onChange(key);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={[styles.chip, active && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    chip: {
        minHeight: touchTarget - 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radii.full,
        backgroundColor: colors.surfaceMuted,
        justifyContent: 'center',
    },
    chipActive: {
        backgroundColor: colors.brand,
    },
    chipText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.slate600,
    },
    chipTextActive: {
        color: colors.white,
        fontFamily: fontFamily.semibold,
    },
});
