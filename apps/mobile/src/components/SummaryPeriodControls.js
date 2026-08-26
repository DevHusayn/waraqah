import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, fontFamily, fontSize, useTheme } from '../theme';

export function SummaryPeriodControls({ periodLabel, onPrevious, onNext }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <View style={styles.row}>
            <Text style={styles.prefix}>New this </Text>
            <Text style={styles.period}>{periodLabel}</Text>
            <ChevronDown size={12} color={colors.muted} strokeWidth={2} />
            <Pressable
                onPress={onPrevious}
                style={styles.navBtn}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                hitSlop={8}
            >
                <ChevronLeft size={14} color={colors.muted} strokeWidth={2} />
            </Pressable>
            <Pressable
                onPress={onNext}
                style={styles.navBtn}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                hitSlop={8}
            >
                <ChevronRight size={14} color={colors.muted} strokeWidth={2} />
            </Pressable>
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
    },
    prefix: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.muted,
    },
    period: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.xs,
        color: colors.foreground,
        textDecorationLine: 'underline',
        textDecorationColor: colors.slate300,
    },
    navBtn: {
        paddingHorizontal: 1,
        paddingVertical: 2,
    },
});
}
