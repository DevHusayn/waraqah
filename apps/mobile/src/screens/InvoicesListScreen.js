import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, PenLine } from 'lucide-react-native';
import {
    formatInvoiceUsageLabel,
    filterNonDraftInvoices,
    isPremiumUser,
    filterInvoicesBySearch,
    sortInvoices,
} from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';
import {
    ChipGroup,
    EmptyState,
    InvoiceListItem,
    PageLoader,
    SearchBar,
    UsageBanner,
} from '../components/ui';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { colors, fontFamily, fontSize, shadows, spacing } from '../theme';

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
];

export function InvoicesListScreen({ navigation }) {
    const { invoices, clients, draftCount, fetchInvoices, invoicesLoading } = useInvoice();
    const { businessInfo } = useSettings();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const limitModalRef = useRef(null);
    const { invoiceUsage, tryCreate, goUpgrade } = useInvoiceCreateGuard(limitModalRef, navigation);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const activeInvoices = useMemo(() => filterNonDraftInvoices(invoices), [invoices]);

    const displayed = useMemo(() => {
        let list = filter === 'all' ? activeInvoices : activeInvoices.filter((i) => i.status === filter);
        list = filterInvoicesBySearch(list, search, clients);
        return sortInvoices(list, 'newest');
    }, [activeInvoices, clients, filter, search]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);
    const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name || 'Unknown';

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchInvoices({ force: true });
        setRefreshing(false);
    };

    if (invoicesLoading && !refreshing && activeInvoices.length === 0) return <PageLoader />;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <FlatList
                data={displayed}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
                ListHeaderComponent={
                    <View>
                        <Text style={styles.pageTitle}>Invoices</Text>
                        <Text style={styles.pageSub}>Track every payment</Text>
                        {!premium && usageLabel ? (
                            <View style={styles.padX}>
                                <UsageBanner label={usageLabel} />
                            </View>
                        ) : null}
                        {draftCount > 0 ? (
                            <Pressable style={styles.draftsLink} onPress={() => navigation.navigate('Drafts')}>
                                <PenLine size={16} color={colors.brand} strokeWidth={2} />
                                <Text style={styles.draftsText}>
                                    {draftCount} draft{draftCount === 1 ? '' : 's'}
                                </Text>
                            </Pressable>
                        ) : null}
                        <View style={styles.padX}>
                            <SearchBar value={search} onChangeText={setSearch} placeholder="Search invoices…" />
                            <ChipGroup options={FILTERS} value={filter} onChange={setFilter} style={{ marginTop: spacing.sm }} />
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.cardShell, shadows.soft]}>
                        <EmptyState
                            icon={FileText}
                            title="No invoices yet"
                            message="Create your first invoice to get paid."
                            actionLabel="Create invoice"
                            onAction={() => tryCreate()}
                        />
                    </View>
                }
                renderItem={({ item, index }) => (
                    <View
                        style={[
                            styles.rowShell,
                            index === 0 && styles.rowFirst,
                            index === displayed.length - 1 && styles.rowLast,
                            index === 0 && shadows.soft,
                        ]}
                    >
                        <InvoiceListItem
                            invoice={item}
                            clientName={getClientName(item.clientId)}
                            last={index === displayed.length - 1}
                            onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}
                        />
                    </View>
                )}
            />
            <InvoiceLimitModal ref={limitModalRef} usage={invoiceUsage} onUpgrade={goUpgrade} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surfaceMuted },
    list: { paddingBottom: 110, flexGrow: 1 },
    pageTitle: {
        fontFamily: fontFamily.bold,
        fontSize: 30,
        color: colors.foreground,
        letterSpacing: -0.8,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
    },
    pageSub: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
        marginTop: 4,
    },
    padX: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
    draftsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.brandSubtle,
        borderRadius: 14,
    },
    draftsText: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.brand,
    },
    cardShell: {
        marginHorizontal: spacing.xl,
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    rowShell: {
        marginHorizontal: spacing.xl,
        backgroundColor: colors.surface,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    rowFirst: {
        marginTop: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    rowLast: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
});
