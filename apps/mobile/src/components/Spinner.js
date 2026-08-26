import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

export function Spinner({ size = 'large', style }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={[styles.wrap, style]}>
            <ActivityIndicator size={size} color={colors.brand} />
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    wrap: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
}
