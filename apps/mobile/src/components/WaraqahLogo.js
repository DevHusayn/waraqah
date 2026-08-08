import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../theme';

const SIZES = {
    sm: { text: 18, icon: 28 },
    md: { text: 22, icon: 36 },
    lg: { text: 28, icon: 48 },
};

const ICONS = {
    default: require('../../assets/brand/logo-icon.png'),
    light: require('../../assets/brand/logo-icon-light.png'),
};

/**
 * Circular W mark — green badge on light backgrounds, white badge when inverted.
 */
export function WaraqahIcon({ size = 'md', inverted = false, style }) {
    const s = SIZES[size] || SIZES.md;
    const source = inverted ? ICONS.light : ICONS.default;

    return (
        <Image
            source={source}
            style={[{ width: s.icon, height: s.icon }, style]}
            accessibilityElementsHidden
            importantForAccessibility="no"
        />
    );
}

/**
 * Brand lockup: circular icon + Bodoni Moda wordmark.
 */
export function WaraqahLogo({ size = 'md', inverted = false, showIcon = true }) {
    const s = SIZES[size] || SIZES.md;

    return (
        <View
            accessibilityLabel="Waraqah"
            style={styles.row}
        >
            {showIcon !== false ? <WaraqahIcon size={size} inverted={inverted} /> : null}
            <Text
                style={[
                    styles.wordmark,
                    { fontSize: s.text, color: inverted ? colors.white : colors.brandDark },
                ]}
            >
                Waraqah
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    wordmark: {
        fontFamily: fontFamily.brand,
        letterSpacing: -0.3,
    },
});
