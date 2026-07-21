import { StyleSheet, Text, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';

export function UsageBanner({ label, style }) {
    if (!label) return null;
    return (
        <View style={[styles.banner, style]}>
            <Crown size={15} color={colors.amber600} strokeWidth={2} />
            <Text style={styles.text}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.amber50,
        borderRadius: radii.md,
    },
    text: {
        flex: 1,
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: '#92400e',
        lineHeight: 18,
    },
});
