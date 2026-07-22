import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { PenLine } from 'lucide-react-native';
import { formatCurrency, getDraftLabel } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { ConfirmModal } from '../components/Modal';
import { PaginationBar } from '../components/PaginationBar';
import { EmptyState, ListRow, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../api/client';
import { buildListQuery } from '../utils/pagination';
import { colors, spacing } from '../theme';

const mapInvoice = (i) => ({ ...i, id: i._id || i.id });

export function DraftsScreen({ navigation }) {
    const { deleteInvoice } = useInvoice();
    const [refreshing, setRefreshing] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/invoices/drafts?${buildListQuery({ page, limit, search })}`),
        []
    );

    const { setPage, data, pagination, loading, refresh } = usePagedList({ fetcher });
    const drafts = data.map(mapInvoice);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteInvoice(deleteId);
            setDeleteId(null);
            await refresh();
        } finally {
            setDeleting(false);
        }
    };

    if (loading && !refreshing && drafts.length === 0) return <PageLoader />;

    return (
        <View style={styles.screen}>
            <FlatList
                data={drafts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                ListHeaderComponent={<PageHeader title="Drafts" subtitle="Resume or delete saved drafts" />}
                ListEmptyComponent={
                    <EmptyState
                        icon={PenLine}
                        title="No drafts"
                        message="Save an invoice as draft while creating to see it here"
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
                            onPress={() => navigation.navigate('CreateInvoice', { id: item.id })}
                            badge={<StatusBadge status="draft" />}
                            onLongPress={() => setDeleteId(item.id)}
                        />
                    );
                }}
            />
            <ConfirmModal
                visible={Boolean(deleteId)}
                title="Delete draft?"
                message="This draft will be permanently removed."
                confirmLabel="Delete"
                danger
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
});
