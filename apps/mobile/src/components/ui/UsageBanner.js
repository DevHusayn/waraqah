import { StyleSheet, Text, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';

export function UsageBanner({ label, style }) {
    if (!label) return null;
    return (
        <View style={[styles.banner, style]}>
            <Crown size={16} color={colors.amber600} />
            <Text style={styles.text}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.amber50,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    text: {
        flex: 1,
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: '#92400e',
    },
});
