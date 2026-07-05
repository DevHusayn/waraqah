import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { PenLine } from 'lucide-react-native';
import { formatCurrency, getDraftLabel } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { ConfirmModal } from '../components/Modal';
import { EmptyState, ListRow, PageHeader, PageLoader, StatusBadge } from '../components/ui';
import { colors, spacing } from '../theme';

export function DraftsScreen({ navigation }) {
    const { draftInvoices, clients, deleteInvoice, fetchDrafts, draftsLoading } = useInvoice();
    const [refreshing, setRefreshing] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const getClient = (clientId) => clients.find((c) => c.id === clientId);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDrafts({ force: true });
        setRefreshing(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteInvoice(deleteId);
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    };

    if (draftsLoading && !refreshing && draftInvoices.length === 0) return <PageLoader />;

    return (
        <View style={styles.screen}>
            <FlatList
                data={draftInvoices}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
                ListHeaderComponent={
                    <PageHeader title="Drafts" subtitle="Resume or delete saved drafts" />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={PenLine}
                        title="No drafts"
                        message="Save an invoice as draft while creating to see it here"
                    />
                }
                renderItem={({ item }) => {
                    const client = getClient(item.clientId);
                    return (
                        <ListRow
                            title={getDraftLabel(item, client)}
                            subtitle={`Edited ${formatDistanceToNow(new Date(item.updatedAt || item.createdAt), { addSuffix: true })} · ${formatCurrency(item.total || 0)}`}
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
