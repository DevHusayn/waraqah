import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../theme';

const SIZES = {
    sm: 18,
    md: 22,
    lg: 28,
};

/**
 * Brand wordmark — “Waraqah” in Bodoni Moda.
 */
export function WaraqahLogo({ size = 'md', inverted = false }) {
    const fontSize = SIZES[size] || SIZES.md;

    return (
        <View accessibilityLabel="Waraqah">
            <Text
                style={[
                    styles.wordmark,
                    { fontSize, color: inverted ? colors.white : colors.brandDark },
                ]}
            >
                Waraqah
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wordmark: {
        fontFamily: fontFamily.brand,
        letterSpacing: -0.3,
    },
});
