import { useEffect } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export function Toast({ message, type = 'info', onHide }) {
    useEffect(() => {
        const timer = setTimeout(onHide, 3200);
        return () => clearTimeout(timer);
    }, [onHide]);

    const bg =
        type === 'success' ? '#ecfdf5' : type === 'error' ? colors.red50 : colors.brandSubtle;
    const border =
        type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecaca' : colors.brandLight;
    const text =
        type === 'success' ? colors.emerald600 : type === 'error' ? colors.red700 : colors.brand;

    return (
        <Animated.View style={[styles.wrap, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.text, { color: text }]}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        bottom: 48,
        left: 16,
        right: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        zIndex: 999,
        elevation: 8,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});
