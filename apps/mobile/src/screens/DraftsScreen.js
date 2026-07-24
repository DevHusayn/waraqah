import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { PenLine } from 'lucide-react-native';
import { formatCurrency, getDraftLabel } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useQuotation } from '../context/QuotationContext';
import { ConfirmModal } from '../components/Modal';
import { PaginationBar } from '../components/PaginationBar';
import { EmptyState, ListRow, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../api/client';
import { buildListQuery } from '../utils/pagination';
import { colors, fontFamily, spacing } from '../theme';

const mapDraft = (d) => ({
    ...d,
    id: d._id || d.id,
    documentType: d.documentType || 'invoice',
});

function TypeBadge({ type }) {
    const isQuotation = type === 'quotation';
    return (
        <View
            style={[
                styles.typeBadge,
                isQuotation ? styles.typeQuotation : styles.typeInvoice,
            ]}
        >
            <Text style={[styles.typeText, isQuotation ? styles.typeQuotationText : styles.typeInvoiceText]}>
                {isQuotation ? 'QTN' : 'INV'}
            </Text>
        </View>
    );
}

export function DraftsScreen({ navigation }) {
    const { deleteInvoice, refreshMeta } = useInvoice();
    const { deleteQuotation } = useQuotation();
    const [refreshing, setRefreshing] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/drafts?${buildListQuery({ page, limit, search })}`),
        []
    );

    const { setPage, data, pagination, loading, refresh } = usePagedList({ fetcher });
    const drafts = data.map(mapDraft);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    const openDraft = (draft) => {
        if (draft.documentType === 'quotation') {
            const tabNav = navigation.getParent?.() || navigation;
            tabNav.navigate('More', {
                screen: 'Quotations',
                params: { screen: 'CreateQuotation', params: { id: draft.id } },
            });
            return;
        }
        navigation.navigate('CreateInvoice', { id: draft.id });
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            if (deleteTarget.documentType === 'quotation') {
                await deleteQuotation(deleteTarget.id);
            } else {
                await deleteInvoice(deleteTarget.id);
            }
            setDeleteTarget(null);
            await refresh();
            if (refreshMeta) await refreshMeta();
        } finally {
            setDeleting(false);
        }
    };

    if (loading && !refreshing && drafts.length === 0) return <PageLoader />;

    return (
        <View style={styles.screen}>
            <FlatList
                data={drafts}
                keyExtractor={(item) => `${item.documentType}-${item.id}`}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                ListHeaderComponent={
                    <PageHeader title="Drafts" subtitle="Resume unfinished invoices and quotations" />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={PenLine}
                        title="No drafts"
                        message="Save an invoice or quotation as a draft to see it here"
                    />
                }
                ListFooterComponent={
                    <PaginationBar
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={setPage}
                        disabled={loading}
                    />
                }
                renderItem={({ item }) => {
                    const client = item.clientName
                        ? { name: item.clientName, company: item.clientCompany }
                        : null;
                    return (
                        <ListRow
                            title={getDraftLabel(item, client)}
                            subtitle={`Edited ${formatDistanceToNow(new Date(item.updatedAt || item.createdAt), { addSuffix: true })} · ${formatCurrency(item.total || 0, item.currency)}`}
                            onPress={() => openDraft(item)}
                            badge={
                                <View style={styles.badgeRow}>
                                    <TypeBadge type={item.documentType} />
                                    <StatusBadge status="draft" />
                                </View>
                            }
                            onLongPress={() =>
                                setDeleteTarget({ id: item.id, documentType: item.documentType })
                            }
                        />
                    );
                }}
            />
            <ConfirmModal
                visible={Boolean(deleteTarget)}
                title="Delete draft?"
                message="This draft will be permanently removed."
                confirmLabel="Delete"
                danger
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    typeInvoice: {
        backgroundColor: colors.brandLight,
        borderColor: 'rgba(22, 163, 74, 0.25)',
    },
    typeQuotation: {
        backgroundColor: '#E0F2FE',
        borderColor: '#BAE6FD',
    },
    typeText: {
        fontFamily: fontFamily.semibold,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    typeInvoiceText: { color: colors.brandDark },
    typeQuotationText: { color: '#0369A1' },
});
