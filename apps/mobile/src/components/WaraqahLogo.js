import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii } from '../theme';

export function WaraqahLogo({ size = 'md' }) {
    const fontSize = size === 'lg' ? 28 : 22;
    return (
        <View style={styles.row}>
            <View style={styles.mark}>
                <Text style={styles.markText}>W</Text>
            </View>
            <Text style={[styles.wordmark, { fontSize }]}>Waraqah</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    mark: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markText: {
        color: colors.white,
        fontFamily: fontFamily.bold,
        fontWeight: '800',
        fontSize: 20,
    },
    wordmark: {
        fontFamily: fontFamily.bold,
        fontWeight: '800',
        color: colors.foreground,
    },
});
