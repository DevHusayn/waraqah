import { useMemo } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { useTheme, fontFamily, fontSize, radii, spacing, touchTarget } from '../../theme';
import { useBaseStyles } from './styles';

export function Input({ error, style, containerStyle, ...props }) {
    const { colors } = useTheme();
    const baseStyles = useBaseStyles();

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
    const { colors } = useTheme();
    const styles = useMemo(() => createSearchStyles(colors), [colors]);

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

function createSearchStyles(colors) {
    return StyleSheet.create({
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
}
