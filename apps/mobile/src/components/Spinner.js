import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export function Spinner({ size = 'large', style }) {
    return (
        <View style={[styles.wrap, style]}>
            <ActivityIndicator size={size} color={colors.brand} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
