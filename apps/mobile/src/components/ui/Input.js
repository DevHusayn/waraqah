import { TextInput, StyleSheet, View } from 'react-native';
import { colors, fontFamily, fontSize, radii, spacing, touchTarget } from '../../theme';
import { baseStyles } from './styles';

export function Input({ error, style, containerStyle, ...props }) {
    return (
        <View style={containerStyle}>
            <TextInput
                placeholderTextColor={colors.slate400}
                style={[baseStyles.input, error && baseStyles.inputError, style]}
                {...props}
            />
        </View>
    );
}

export function SearchInput({ style, ...props }) {
    return (
        <TextInput
            placeholderTextColor={colors.slate400}
            style={[styles.search, style]}
            returnKeyType="search"
            clearButtonMode="while-editing"
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    search: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: radii.md,
        paddingHorizontal: spacing.lg,
        minHeight: touchTarget,
        fontSize: fontSize.md,
        fontFamily: fontFamily.regular,
        color: colors.foreground,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
});
