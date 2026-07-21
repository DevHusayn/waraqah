import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Banknote,
    Bell,
    Building2,
    ChevronDown,
    Clock,
    CreditCard,
    FileText,
    LogOut,
    Users,
} from 'lucide-react-native';
import {
    formatCurrency,
    formatInvoiceUsageLabel,
    getBusinessInitials,
    isPremiumUser,
} from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';
import { Sparkline } from '../components/Sparkline';
import {
    AvatarInitials,
    BottomSheet,
    EmptyState,
    InvoiceListItem,
    ListRow,
    PageLoader,
    UsageBanner,
} from '../components/ui';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { colors, fontFamily, fontSize, lineHeight, radii, shadows, spacing } from '../theme';
import { hapticSelection } from '../utils/haptics';

const CARD_WIDTH = Dimensions.get('window').width - spacing.xl * 2;

function greetingForHour(hour = new Date().getHours()) {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function StatCell({ icon: Icon, label, value, iconBg, iconColor, valueColor }) {
    return (
        <View style={styles.statCell}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                <Icon size={16} color={iconColor} strokeWidth={2.25} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

export function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { businessInfo } = useSettings();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [cardIndex, setCardIndex] = useState(0);
    const limitModalRef = useRef(null);
    const menuRef = useRef(null);
    const { invoiceUsage, tryCreate, goUpgrade } = useInvoiceCreateGuard(limitModalRef, navigation);

    const loadDashboard = useCallback(async () => {
        try {
            setError(null);
            const dashboard = await apiFetch('/invoices/dashboard');
            setData(dashboard);
        } catch (err) {
            setError(err.message || 'Could not load dashboard');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const stats = data?.stats;
    const recent = data?.recentInvoices || [];
    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);
    const firstName = (user?.name || businessInfo?.name || 'there').split(/\s+/)[0];
    const initials = getBusinessInitials(user?.name || businessInfo?.name || 'W');
    const revenue = stats?.paidRevenue ?? 0;
    const hour = new Date().getHours();
    const greeting = greetingForHour(hour);
    const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤' : '🌙';

    const openMenu = () => {
        hapticSelection();
        menuRef.current?.snapToIndex(0);
    };

    const go = (tab, screen) => {
        menuRef.current?.close();
        if (screen) navigation.navigate(tab, { screen });
        else navigation.navigate(tab);
    };

    if (loading && !refreshing && !data) return <PageLoader />;

    const heroCards = [
        {
            key: 'revenue',
            label: 'Total revenue',
            amount: formatCurrency(revenue),
            trend: null,
        },
        {
            key: 'outstanding',
            label: 'Outstanding',
            amount: formatCurrency(stats?.pendingRevenue ?? 0),
            trend: null,
        },
    ];

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>
                            {greeting} {greetingEmoji}
                        </Text>
                        <Text style={styles.name}>{firstName}</Text>
                        <Text style={styles.subtitle}>Manage your invoices in one place</Text>
                    </View>
                    <Pressable
                        onPress={openMenu}
                        style={styles.avatarBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Account menu"
                    >
                        <AvatarInitials initials={initials} size={48} />
                        <ChevronDown size={16} color={colors.slate400} strokeWidth={2.5} style={styles.chevron} />
                    </Pressable>
                </View>

                {!premium && usageLabel ? (
                    <View style={styles.bannerWrap}>
                        <UsageBanner label={usageLabel} />
                    </View>
                ) : null}

                {error && !data ? (
                    <EmptyState
                        title="Couldn't load dashboard"
                        message={error}
                        actionLabel="Retry"
                        onAction={loadDashboard}
                        icon={FileText}
                    />
                ) : null}

                {/* Hero carousel card */}
                <FlatList
                    data={heroCards}
                    keyExtractor={(item) => item.key}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={CARD_WIDTH + spacing.md}
                    contentContainerStyle={styles.carousel}
                    onMomentumScrollEnd={(e) => {
                        const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + spacing.md));
                        setCardIndex(i);
                    }}
                    renderItem={({ item }) => (
                        <View style={[styles.heroCard, shadows.card, { width: CARD_WIDTH }]}>
                            <View style={styles.heroTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.heroLabel}>{item.label}</Text>
                                    <Text style={styles.heroAmount} numberOfLines={1}>
                                        {item.amount}
                                    </Text>
                                    {item.key === 'revenue' ? (
                                        <View style={styles.trendPill}>
                                            <Text style={styles.trendText}>↑ This month</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <Sparkline width={112} height={52} />
                            </View>

                            <View style={styles.statGrid}>
                                <StatCell
                                    icon={Banknote}
                                    label="Revenue"
                                    value={formatCurrency(stats?.paidRevenue ?? 0)}
                                    iconBg={colors.brandLight}
                                    iconColor={colors.brand}
                                    valueColor={colors.brand}
                                />
                                <StatCell
                                    icon={Clock}
                                    label="Outstanding"
                                    value={formatCurrency(stats?.pendingRevenue ?? 0)}
                                    iconBg="#FFEDD5"
                                    iconColor="#EA580C"
                                    valueColor="#EA580C"
                                />
                                <StatCell
                                    icon={FileText}
                                    label="Invoices"
                                    value={String(stats?.totalInvoices ?? 0)}
                                    iconBg={colors.violet50}
                                    iconColor={colors.violet600}
                                />
                                <StatCell
                                    icon={Users}
                                    label="Clients"
                                    value={String(stats?.totalClients ?? 0)}
                                    iconBg="#DBEAFE"
                                    iconColor="#2563EB"
                                />
                            </View>
                        </View>
                    )}
                />

                <View style={styles.dots}>
                    {heroCards.map((c, i) => (
                        <View key={c.key} style={[styles.dot, i === cardIndex && styles.dotActive]} />
                    ))}
                </View>

                {/* Recent invoices */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent invoices</Text>
                    <Pressable onPress={() => navigation.navigate('Invoices')} hitSlop={12}>
                        <Text style={styles.seeAll}>See all ›</Text>
                    </Pressable>
                </View>

                <View style={[styles.listCard, shadows.soft]}>
                    {recent.length === 0 ? (
                        <EmptyState
                            title="No invoices yet"
                            message="Create your first invoice to get paid."
                            icon={FileText}
                            actionLabel="Create invoice"
                            onAction={() =>
                                tryCreate(() => navigation.navigate('Invoices', { screen: 'CreateInvoice' }))
                            }
                        />
                    ) : (
                        recent.map((inv, index) => (
                            <InvoiceListItem
                                key={inv.id}
                                invoice={inv}
                                last={index === recent.length - 1}
                                onPress={() =>
                                    navigation.navigate('Invoices', {
                                        screen: 'InvoiceDetail',
                                        params: { id: inv.id },
                                    })
                                }
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            <BottomSheet ref={menuRef} snapPoints={['50%']}>
                <Text style={styles.menuTitle}>{businessInfo?.name || 'Your business'}</Text>
                <Text style={styles.menuEmail}>{user?.email || ''}</Text>
                <ListRow
                    title="Profile"
                    left={<Building2 size={20} color={colors.slate600} strokeWidth={2} />}
                    onPress={() => go('More', 'ProfileHome')}
                    dense
                />
                <ListRow
                    title="Settings"
                    left={<Building2 size={20} color={colors.slate600} strokeWidth={2} />}
                    onPress={() => go('More', 'Settings')}
                    dense
                />
                <ListRow
                    title="Subscription"
                    left={<CreditCard size={20} color={colors.slate600} strokeWidth={2} />}
                    onPress={() => go('More', 'Upgrade')}
                    dense
                />
                <ListRow
                    title="Notifications"
                    left={<Bell size={20} color={colors.slate600} strokeWidth={2} />}
                    onPress={() => go('More', 'Settings')}
                    dense
                />
                <ListRow
                    title="Sign out"
                    left={<LogOut size={20} color={colors.red600} strokeWidth={2} />}
                    onPress={() => {
                        menuRef.current?.close();
                        logout();
                    }}
                    showChevron={false}
                    last
                    dense
                />
            </BottomSheet>

            <InvoiceLimitModal ref={limitModalRef} usage={invoiceUsage} onUpgrade={goUpgrade} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surfaceMuted },
    screen: { flex: 1 },
    content: { paddingBottom: spacing.huge },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    headerText: { flex: 1, minWidth: 0 },
    greeting: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: colors.slate600,
    },
    name: {
        marginTop: 2,
        fontFamily: fontFamily.bold,
        fontSize: 30,
        color: colors.foreground,
        letterSpacing: -0.8,
        lineHeight: 36,
    },
    subtitle: {
        marginTop: 4,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        lineHeight: lineHeight.sm,
    },
    avatarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 4,
    },
    chevron: { marginLeft: -2 },
    bannerWrap: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    carousel: {
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
    },
    heroCard: {
        backgroundColor: colors.surface,
        borderRadius: 22,
        padding: spacing.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    heroLabel: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.muted,
    },
    heroAmount: {
        marginTop: 4,
        fontFamily: fontFamily.bold,
        fontSize: 28,
        color: colors.foreground,
        letterSpacing: -0.8,
    },
    trendPill: {
        alignSelf: 'flex-start',
        marginTop: spacing.sm,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.full,
        backgroundColor: colors.brandLight,
    },
    trendText: {
        fontFamily: fontFamily.semibold,
        fontSize: 11,
        color: colors.brand,
    },
    statGrid: {
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderLight,
        paddingTop: spacing.lg,
    },
    statCell: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 2,
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    statLabel: {
        fontFamily: fontFamily.medium,
        fontSize: 10,
        color: colors.muted,
        textAlign: 'center',
    },
    statValue: {
        fontFamily: fontFamily.bold,
        fontSize: 12,
        color: colors.foreground,
        textAlign: 'center',
        letterSpacing: -0.2,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.slate200,
    },
    dotActive: {
        width: 16,
        backgroundColor: colors.brand,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        letterSpacing: -0.3,
    },
    seeAll: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.brand,
    },
    listCard: {
        marginHorizontal: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    menuTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        paddingHorizontal: spacing.sm,
    },
    menuEmail: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.sm,
    },
});
