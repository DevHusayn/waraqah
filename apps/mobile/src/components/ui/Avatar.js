import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radii } from '../../theme';

function getInitials(name = '') {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || '?'
    );
}

export function Avatar({ name, size = 40, color = colors.brand, backgroundColor = colors.brandLight }) {
    const dim = { width: size, height: size, borderRadius: Math.max(radii.sm, size / 3.5) };
    return (
        <View
            style={[styles.wrap, dim, { backgroundColor }]}
            accessibilityLabel={name ? `Avatar for ${name}` : 'Avatar'}
        >
            <Text style={[styles.text, { color, fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontFamily: fontFamily.bold,
        fontWeight: '700',
    },
});
