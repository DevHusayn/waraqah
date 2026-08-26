import { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../../theme';

export function Screen({
    children,
    scroll = false,
    style,
    contentStyle,
    muted = false,
    edges = ['top', 'left', 'right'],
    safe = true,
}) {
    const { colors } = useTheme();
    const bg = muted ? colors.surfaceMuted : colors.surface;
    const body = scroll ? (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
    );

    if (!safe) {
        return <View style={[{ flex: 1, backgroundColor: bg }, style]}>{body}</View>;
    }

    return (
        <SafeAreaView style={[{ flex: 1, backgroundColor: bg }, style]} edges={edges}>
            {body}
        </SafeAreaView>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.huge,
    },
});
}
