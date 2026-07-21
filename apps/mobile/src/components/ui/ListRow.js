import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing, touchTarget } from '../../theme';
import { hapticSelection } from '../../utils/haptics';

/**
 * Banking-style list row — flat, separator-based, no card chrome.
 */
export function ListRow({
    title,
    subtitle,
    meta,
    right,
    left,
    onPress,
    onLongPress,
    showChevron = true,
    style,
    badge,
    last = false,
    dense = false,
}) {
    const inner = (
        <View style={[styles.row, dense && styles.rowDense, !last && styles.rowBorder, style]}>
            {left ? <View style={styles.left}>{left}</View> : null}
            <View style={styles.body}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    {badge}
                </View>
                {subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                        {subtitle}
                    </Text>
                ) : null}
                {meta ? (
                    <Text style={styles.meta} numberOfLines={1}>
                        {meta}
                    </Text>
                ) : null}
            </View>
            {right ? <View style={styles.right}>{right}</View> : null}
            {onPress && showChevron && !right ? (
                <ChevronRight size={18} color={colors.slate300} strokeWidth={2} />
            ) : null}
        </View>
    );

    if (!onPress) return inner;

    return (
        <Pressable
            onPress={() => {
                hapticSelection();
                onPress();
            }}
            onLongPress={onLongPress}
            accessibilityRole="button"
            style={({ pressed }) => [pressed && styles.pressed]}
        >
            {inner}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: touchTarget + 12,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.surface,
    },
    rowDense: {
        minHeight: touchTarget,
        paddingVertical: spacing.md,
    },
    rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderLight,
    },
    pressed: {
        backgroundColor: colors.surfaceMuted,
    },
    left: {
        marginRight: 0,
    },
    body: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.md,
        fontWeight: '600',
        color: colors.foreground,
        letterSpacing: -0.2,
        flexShrink: 1,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginTop: 3,
        lineHeight: lineHeight.sm,
    },
    meta: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.slate400,
        marginTop: 2,
    },
    right: {
        alignItems: 'flex-end',
        marginLeft: spacing.sm,
    },
});

export function AvatarInitials({ initials, color = colors.brand, bg = colors.brandLight, size = 40 }) {
    return (
        <View style={[avatarStyles.wrap, { width: size, height: size, borderRadius: size / 2.5, backgroundColor: bg }]}>
            <Text style={[avatarStyles.text, { color, fontSize: size * 0.34 }]}>{initials}</Text>
        </View>
    );
}

const avatarStyles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontFamily: fontFamily.bold,
        fontWeight: '700',
    },
});
