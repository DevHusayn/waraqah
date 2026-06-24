import { StyleSheet, TextInput, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';

export function SearchBar({ value, onChangeText, placeholder = 'Search…', style }) {
    return (
        <View style={[styles.wrap, style]}>
            <Search size={18} color={colors.slate400} style={styles.icon} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.slate400}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    icon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.foreground,
    },
});
