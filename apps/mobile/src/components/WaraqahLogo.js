import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

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
        borderRadius: 12,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markText: {
        color: colors.white,
        fontWeight: '800',
        fontSize: 20,
    },
    wordmark: {
        fontWeight: '800',
        color: colors.slate900,
    },
});
