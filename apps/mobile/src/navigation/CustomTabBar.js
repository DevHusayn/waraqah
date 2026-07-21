import { useRef } from 'react';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilePlus2 } from 'lucide-react-native';
import { colors, fontFamily, shadows, spacing, touchTarget } from '../theme';
import { hapticLight, hapticSelection } from '../utils/haptics';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';

function TabItem({ isFocused, options, label, badge, onPress, onLongPress }) {
    const color = isFocused ? colors.brand : colors.slate400;
    const Icon = options.tabBarIcon;

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withTiming(isFocused ? 1.05 : 1, { duration: 160 }) }],
    }));

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel || label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            hitSlop={4}
        >
            {isFocused ? <View style={styles.activeLine} /> : <View style={styles.activeLinePlaceholder} />}
            <Animated.View style={[styles.iconWrap, iconStyle]}>
                {Icon ? Icon({ focused: isFocused, color, size: 24 }) : null}
                {badge != null && badge > 0 ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                    </View>
                ) : null}
            </Animated.View>
            <Text
                style={[
                    styles.label,
                    { color, fontFamily: isFocused ? fontFamily.semibold : fontFamily.medium },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function CreateTab({ onPress }) {
    return (
        <View style={styles.createSlot}>
            <Pressable
                onPress={() => {
                    hapticLight();
                    onPress?.();
                }}
                style={({ pressed }) => [styles.createFab, shadows.fab, pressed && styles.createPressed]}
                accessibilityRole="button"
                accessibilityLabel="Create invoice"
            >
                <FilePlus2 size={26} color={colors.white} strokeWidth={2.25} />
            </Pressable>
            <Text style={styles.createLabel}>Create</Text>
        </View>
    );
}

export function CustomTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const limitModalRef = useRef(null);
    const { invoiceUsage, tryCreate, goUpgrade } = useInvoiceCreateGuard(limitModalRef, navigation);

    const handleCreate = () => {
        tryCreate(() => {
            navigation.navigate('Invoices', { screen: 'CreateInvoice' });
        });
    };

    // Insert Create FAB after Invoices (index 1) → visual: Home, Invoices, Create, Clients, More
    const leftRoutes = state.routes.slice(0, 2);
    const rightRoutes = state.routes.slice(2);

    const renderTab = (route) => {
        const index = state.routes.findIndex((r) => r.key === route.key);
        const { options } = descriptors[route.key];
        const label =
            options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name;
        const isFocused = state.index === index;
        const badge = options.tabBarBadge;

        return (
            <TabItem
                key={route.key}
                isFocused={isFocused}
                options={options}
                label={label}
                badge={badge}
                onPress={() => {
                    hapticSelection();
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
        );
    };

    return (
        <>
            <View
                style={[
                    styles.wrap,
                    shadows.soft,
                    { paddingBottom: Math.max(insets.bottom, spacing.sm) },
                ]}
            >
                {leftRoutes.map(renderTab)}
                <CreateTab onPress={handleCreate} />
                {rightRoutes.map(renderTab)}
            </View>
            <InvoiceLimitModal ref={limitModalRef} usage={invoiceUsage} onUpgrade={goUpgrade} />
        </>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
        minHeight: 64,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        minHeight: touchTarget + 12,
        paddingBottom: 4,
        gap: 2,
    },
    activeLine: {
        width: 28,
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.brand,
        marginBottom: 4,
    },
    activeLinePlaceholder: {
        width: 28,
        height: 3,
        marginBottom: 4,
    },
    iconWrap: {
        position: 'relative',
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        letterSpacing: 0.1,
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
    createSlot: {
        width: 76,
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: -28,
        paddingBottom: 2,
    },
    createFab: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    createPressed: {
        transform: [{ scale: 0.96 }],
        opacity: 0.95,
    },
    createLabel: {
        fontFamily: fontFamily.medium,
        fontSize: 10,
        color: colors.slate400,
        marginTop: 2,
    },
});
