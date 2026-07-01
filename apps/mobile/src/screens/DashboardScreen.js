import { useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { Clock, FileText, Users, Wallet } from 'lucide-react-native';
import {
    formatCurrency,
    formatInvoiceUsageLabel,
    filterNonDraftInvoices,
    getDisplayNumber,
    isPremiumUser,
} from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';
import {
    Button,
    Card,
    ListRow,
    PageHeader,
    PageLoader,
    StatCard,
    StatusBadge,
    UsageBanner,
} from '../components/ui';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export function DashboardScreen({ navigation }) {
    const { invoices, clients, loading, fetchUserData } = useInvoice();
    const { businessInfo } = useSettings();
    const [refreshing, setRefreshing] = useState(false);
    const limitModalRef = useRef(null);
    const { invoiceUsage, tryCreate, goUpgrade } = useInvoiceCreateGuard(limitModalRef, navigation);

    const activeInvoices = filterNonDraftInvoices(invoices);
    const totalRevenue = activeInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
    const pendingRevenue = activeInvoices.filter((i) => i.status === 'pending').reduce((s, i) => s + (i.total || 0), 0);
    const recent = [...activeInvoices]
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.createdAt))
        .slice(0, 5);
    const overdue = activeInvoices.filter((i) => i.status === 'overdue');
    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

    const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name || 'Unknown';

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    if (loading && !refreshing) return <PageLoader />;

    return (
        <>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
            >
                <PageHeader title="Dashboard" subtitle="Your invoicing overview" />
                {!premium && usageLabel ? <UsageBanner label={usageLabel} /> : null}

                <View style={styles.statsGrid}>
                    <StatCard label="Total invoices" value={String(activeInvoices.length)} icon={FileText} theme="brand" />
                    <StatCard label="Total clients" value={String(clients.length)} icon={Users} theme="violet" />
                    <StatCard label="Revenue (paid)" value={formatCurrency(totalRevenue)} icon={Wallet} theme="revenue" />
                    <StatCard label="Pending" value={formatCurrency(pendingRevenue)} icon={Clock} theme="amber" />
                </View>

                <Card style={styles.quickActions} elevated>
                    <Text style={styles.sectionTitle}>Quick actions</Text>
                    <View style={styles.actionRow}>
                        <Button
                            title="Create invoice"
                            onPress={() => tryCreate(() => navigation.navigate('Invoices', { screen: 'CreateInvoice' }))}
                            style={{ flex: 1 }}
                        />
                        <Button title="Clients" variant="secondary" onPress={() => navigation.navigate('Clients')} style={{ flex: 1 }} />
                    </View>
                    <Button
                        title="Monthly statements"
                        variant="secondary"
                        onPress={() => navigation.getParent()?.navigate('More', { screen: 'MonthlyStatement' })}
                        style={{ marginTop: spacing.sm }}
                    />
                </Card>

                <Text style={styles.section}>Recent invoices</Text>
                {recent.length === 0 ? (
                    <Card elevated><Text style={styles.muted}>No invoices yet</Text></Card>
                ) : (
                    recent.map((inv) => (
                        <ListRow
                            key={inv.id}
                            title={getDisplayNumber(inv)}
                            subtitle={`${getClientName(inv.clientId)} · ${format(new Date(inv.date), 'MMM d, yyyy')} · ${formatCurrency(inv.total)}`}
                            onPress={() => navigation.navigate('Invoices', { screen: 'InvoiceDetail', params: { id: inv.id } })}
                            badge={<StatusBadge status={inv.status} />}
                        />
                    ))
                )}

                {overdue.length > 0 ? (
                    <>
                        <Text style={[styles.section, { color: colors.red600 }]}>Overdue ({overdue.length})</Text>
                        {overdue.slice(0, 3).map((inv) => (
                            <ListRow
                                key={inv.id}
                                title={getDisplayNumber(inv)}
                                subtitle={formatCurrency(inv.total)}
                                onPress={() => navigation.navigate('Invoices', { screen: 'InvoiceDetail', params: { id: inv.id } })}
                            />
                        ))}
                    </>
                ) : null}
            </ScrollView>
            <InvoiceLimitModal ref={limitModalRef} usage={invoiceUsage} onUpgrade={goUpgrade} />
        </>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.lg },
    quickActions: { marginBottom: spacing.lg },
    sectionTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.foreground,
        marginBottom: spacing.md,
    },
    actionRow: { flexDirection: 'row', gap: spacing.sm },
    section: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.md,
        color: colors.foreground,
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },
    muted: { fontFamily: fontFamily.regular, color: colors.muted, fontSize: fontSize.sm },
});
