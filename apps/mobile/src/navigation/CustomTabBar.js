import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize, shadows, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

export function CustomTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.wrap, shadows.soft, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                          ? options.title
                          : route.name;
                const isFocused = state.index === index;
                const badge = options.tabBarBadge;

                const onPress = () => {
                    hapticSelection();
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({ type: 'tabLongPress', target: route.key });
                };

                const color = isFocused ? colors.brand : colors.slate400;
                const Icon = options.tabBarIcon;

                return (
                    <Pressable
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tab}
                    >
                        {isFocused ? <View style={styles.indicator} /> : null}
                        <View style={styles.iconWrap}>
                            {Icon ? Icon({ focused: isFocused, color, size: 22 }) : null}
                            {badge != null && badge > 0 ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                                </View>
                            ) : null}
                        </View>
                        <Text style={[styles.label, { color, fontFamily: isFocused ? fontFamily.semibold : fontFamily.medium }]}>
                            {label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.xs,
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        top: 0,
        width: 28,
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.brand,
    },
    iconWrap: {
        position: 'relative',
        marginBottom: 2,
    },
    label: {
        fontSize: fontSize.xs,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: colors.white,
        fontSize: 9,
        fontFamily: fontFamily.bold,
        fontWeight: '700',
    },
});
