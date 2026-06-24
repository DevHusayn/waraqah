import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { PenLine } from 'lucide-react-native';
import {
    formatCurrency,
    formatInvoiceUsageLabel,
    filterNonDraftInvoices,
    getDisplayNumber,
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
    FAB,
    ListRow,
    PageHeader,
    PageLoader,
    SearchBar,
    StatusBadge,
    UsageBanner,
} from '../components/ui';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { colors, fontFamily, fontSize, spacing } from '../theme';

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
];

export function InvoicesListScreen({ navigation }) {
    const { invoices, clients, draftInvoices, loading, fetchUserData } = useInvoice();
    const { businessInfo } = useSettings();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const limitModalRef = useRef(null);
    const { invoiceUsage, tryCreate, goUpgrade } = useInvoiceCreateGuard(limitModalRef, navigation);

    const activeInvoices = useMemo(() => filterNonDraftInvoices(invoices), [invoices]);

    const displayed = useMemo(() => {
        let list = filter === 'all' ? activeInvoices : activeInvoices.filter((i) => i.status === filter);
        list = filterInvoicesBySearch(list, search, clients);
        return sortInvoices(list, 'newest');
    }, [activeInvoices, clients, filter, search]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);
    const draftCount = draftInvoices?.length || 0;

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name || 'Unknown';

    if (loading && !refreshing) return <PageLoader />;

    return (
        <View style={styles.screen}>
            <FlatList
                data={displayed}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
                ListHeaderComponent={
                    <>
                        <PageHeader title="Invoices" subtitle="Manage and track invoices" />
                        {!premium && usageLabel ? <UsageBanner label={usageLabel} /> : null}
                        {draftCount > 0 ? (
                            <Pressable style={styles.draftsLink} onPress={() => navigation.navigate('Drafts')}>
                                <PenLine size={16} color={colors.brand} />
                                <Text style={styles.draftsText}>{draftCount} draft{draftCount === 1 ? '' : 's'} saved</Text>
                            </Pressable>
                        ) : null}
                        <SearchBar value={search} onChangeText={setSearch} placeholder="Search invoices…" style={{ marginTop: spacing.sm }} />
                        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
                    </>
                }
                ListEmptyComponent={
                    <EmptyState
                        title="No invoices"
                        message="Create your first invoice to get started"
                        action={
                            <Pressable onPress={() => tryCreate()}>
                                <Text style={styles.cta}>Create invoice</Text>
                            </Pressable>
                        }
                    />
                }
                renderItem={({ item }) => (
                    <ListRow
                        title={getDisplayNumber(item)}
                        subtitle={`${getClientName(item.clientId)} · ${format(new Date(item.date), 'MMM d, yyyy')}`}
                        onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}
                        badge={<StatusBadge status={item.status} />}
                        right={<Text style={styles.amount}>{formatCurrency(item.total)}</Text>}
                        showChevron={false}
                    />
                )}
            />
            <FAB onPress={() => tryCreate()} label="Create" />
            <InvoiceLimitModal ref={limitModalRef} usage={invoiceUsage} onUpgrade={goUpgrade} />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    list: { padding: spacing.lg, paddingBottom: 100, flexGrow: 1 },
    draftsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.brandSubtle,
        borderRadius: 12,
    },
    draftsText: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.brand,
    },
    amount: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.foreground,
    },
    cta: {
        fontFamily: fontFamily.semibold,
        color: colors.brand,
        marginTop: spacing.md,
    },
});
