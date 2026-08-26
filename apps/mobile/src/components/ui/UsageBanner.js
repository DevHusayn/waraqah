import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { colors, fontFamily, fontSize, radii, spacing , useTheme } from '../../theme';

export function UsageBanner({ label, style }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    if (!label) return null;
    return (
        <View style={[styles.banner, style]}>
            <Crown size={15} color={colors.amber600} strokeWidth={2} />
            <Text style={styles.text}>{label}</Text>
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
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
        color: colors.amber600,
        lineHeight: 18,
    },
});
}
