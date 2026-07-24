import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList } from 'lucide-react-native';
import { formatInvoiceUsageLabel, isPremiumUser } from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';
import { PaginationBar } from '../components/PaginationBar';
import {
    ChipGroup,
    EmptyState,
    InvoiceListItem,
    PageLoader,
    SearchBar,
    UsageBanner,
} from '../components/ui';
import { useQuotationCreateGuard } from '../hooks/useQuotationCreateGuard';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../api/client';
import { buildListQuery } from '../utils/pagination';
import { colors, fontFamily, fontSize, shadows, spacing } from '../theme';

const FILTER_VALUES = ['all', 'sent', 'accepted', 'rejected', 'expired', 'converted'];

const mapQuotation = (q) => ({ ...q, id: q._id || q.id, documentType: 'quotation' });

export function QuotationsListScreen({ navigation }) {
    const { businessInfo } = useSettings();
    const [filter, setFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const limitModalRef = useRef(null);
    const { invoiceUsage, tryCreate, goUpgrade } = useQuotationCreateGuard(limitModalRef, navigation);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(
                `/quotations?${buildListQuery({
                    page,
                    limit,
                    search,
                    status: filter,
                    sort: 'newest',
                })}`
            ),
        [filter]
    );

    const {
        page,
        setPage,
        search,
        setSearch,
        data,
        pagination,
        statusCounts,
        loading,
        refresh,
    } = usePagedList({
        fetcher,
        extraDeps: [filter],
    });

    useEffect(() => {
        setPage(1);
    }, [filter, setPage]);

    const quotations = useMemo(() => data.map(mapQuotation), [data]);

    const filterOptions = useMemo(() => {
        const counts = statusCounts || {};
        return FILTER_VALUES.map((value) => ({
            value,
            label:
                counts[value] != null
                    ? `${value[0].toUpperCase()}${value.slice(1)} (${counts[value]})`
                    : value[0].toUpperCase() + value.slice(1),
        }));
    }, [statusCounts]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    if (loading && !refreshing && quotations.length === 0) return <PageLoader />;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <FlatList
                data={quotations}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                ListHeaderComponent={
                    <View>
                        <Text style={styles.pageTitle}>Quotations</Text>
                        <Text style={styles.pageSub}>Manage estimates and proposals</Text>
                        {!premium && usageLabel ? (
                            <View style={styles.padX}>
                                <UsageBanner label={usageLabel} />
                            </View>
                        ) : null}
                        <View style={styles.padX}>
                            <SearchBar value={search} onChangeText={setSearch} placeholder="Search quotations…" />
                            <ChipGroup
                                options={filterOptions}
                                value={filter}
                                onChange={setFilter}
                                style={{ marginTop: spacing.sm }}
                            />
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.cardShell, shadows.soft]}>
                        <EmptyState
                            icon={ClipboardList}
                            title={search ? 'No matching quotations' : 'No quotations yet'}
                            message={
                                search
                                    ? 'Try a different search term.'
                                    : 'Create your first quotation to send an estimate.'
                            }
                            actionLabel={search ? undefined : 'Create quotation'}
                            onAction={
                                search
                                    ? undefined
                                    : () => tryCreate(() => navigation.navigate('CreateQuotation'))
                            }
                        />
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.padX}>
                        <PaginationBar
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            onPageChange={setPage}
                            disabled={loading}
                        />
                    </View>
                }
                renderItem={({ item, index }) => (
                    <View
                        style={[
                            styles.rowShell,
                            index === 0 && styles.rowFirst,
                            index === quotations.length - 1 && styles.rowLast,
                            index === 0 && shadows.soft,
                        ]}
                    >
                        <InvoiceListItem
                            invoice={item}
                            clientName={item.clientName || 'Unknown'}
                            last={index === quotations.length - 1}
                            onPress={() => navigation.navigate('QuotationDetail', { id: item.id })}
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
