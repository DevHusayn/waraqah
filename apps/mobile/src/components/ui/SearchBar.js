import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, fontFamily, fontSize, radii, spacing, touchTarget } from '../../theme';

export function SearchBar({ value, onChangeText, placeholder = 'Search…', style }) {
    return (
        <View style={[styles.wrap, style]}>
            <Search size={18} color={colors.slate400} strokeWidth={2} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.slate400}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                accessibilityLabel={placeholder}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.lg,
        minHeight: touchTarget,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.foreground,
    },
});
