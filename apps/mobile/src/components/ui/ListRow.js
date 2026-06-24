import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';
import { hapticSelection } from '../../utils/haptics';
import { Card } from './Card';

export function ListRow({
    title,
    subtitle,
    right,
    left,
    onPress,
    onLongPress,
    showChevron = true,
    style,
    badge,
}) {
    const content = (
        <Card style={[styles.row, style]} elevated={!!onPress}>
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
            </View>
            {right || (onPress && showChevron ? <ChevronRight size={18} color={colors.slate400} /> : null)}
        </Card>
    );

    if (!onPress) return content;

    return (
        <Pressable
            onPress={() => {
                hapticSelection();
                onPress();
            }}
            onLongPress={onLongPress}
            style={({ pressed }) => [pressed && { opacity: 0.92 }]}
        >
            {content}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm,
        paddingVertical: spacing.md,
    },
    left: {
        marginRight: -4,
    },
    body: {
        flex: 1,
        minWidth: 0,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    title: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.foreground,
        flex: 1,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.muted,
        marginTop: 2,
    },
});

export function AvatarInitials({ initials, color = colors.brand, bg = colors.brandLight }) {
    return (
        <View style={[avatarStyles.wrap, { backgroundColor: bg }]}>
            <Text style={[avatarStyles.text, { color }]}>{initials}</Text>
        </View>
    );
}

const avatarStyles = StyleSheet.create({
    wrap: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        fontWeight: '700',
    },
});
