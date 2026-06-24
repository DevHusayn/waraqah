import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';
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
                        style={[styles.chip, active && styles.chipActive]}
                    >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {label}
                        </Text>
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radii.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: colors.brandSubtle,
        borderColor: colors.brand,
    },
    chipText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.slate600,
        textTransform: 'capitalize',
    },
    chipTextActive: {
        color: colors.brand,
        fontFamily: fontFamily.semibold,
    },
});
