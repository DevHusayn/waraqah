import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package } from 'lucide-react-native';
import { formatCurrency } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { PaginationBar } from '../components/PaginationBar';
import {
    BottomSheet,
    Button,
    EmptyState,
    FAB,
    Input,
    Label,
    ListRow,
    PageHeader,
    PageLoader,
    SearchBar,
} from '../components/ui';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../api/client';
import { buildListQuery } from '../utils/pagination';
import { colors, fontFamily, fontSize, spacing } from '../theme';

const EMPTY = { name: '', description: '', price: '' };
const mapProduct = (p) => ({ ...p, id: p._id || p.id });

export function ProductsScreen() {
    const { addProduct, updateProduct, deleteProduct } = useInvoice();
    const { showToast } = useToast();
    const [refreshing, setRefreshing] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const sheetRef = useRef(null);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/products?${buildListQuery({ page, limit, search })}`),
        []
    );

    const {
        page,
        setPage,
        search,
        setSearch,
        data,
        pagination,
        loading,
        refresh,
    } = usePagedList({ fetcher });

    const products = data.map(mapProduct);

    const openAdd = () => {
        setEditing(null);
        setForm(EMPTY);
        sheetRef.current?.snapToIndex(0);
    };

    const openEdit = (product) => {
        setEditing(product);
        setForm({
            name: product.name || '',
            description: product.description || '',
            price: String(product.price ?? product.unitPrice ?? ''),
        });
        sheetRef.current?.snapToIndex(0);
    };

    const closeSheet = () => sheetRef.current?.close();

    const handleSave = async () => {
        if (!form.name.trim()) {
            showToast('Product name is required', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price) || 0,
                unitPrice: Number(form.price) || 0,
            };
            if (editing) {
                await updateProduct(editing.id, payload);
                showToast('Product updated', 'success');
            } else {
                await addProduct(payload);
                showToast('Product added', 'success');
            }
            closeSheet();
            await refresh();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await deleteProduct(deleteId);
            setDeleteId(null);
            showToast('Product deleted', 'success');
            await refresh();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    if (loading && products.length === 0 && !refreshing && !search) return <PageLoader />;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                ListHeaderComponent={
                    <View>
                        <PageHeader title="Products" subtitle="Reusable line items" />
                        <View style={styles.padX}>
                            <SearchBar value={search} onChangeText={setSearch} placeholder="Search products…" />
                        </View>
                        <View style={styles.divider} />
                    </View>
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={Package}
                        title={search ? 'No matches' : 'No products yet'}
                        message={
                            search
                                ? 'Try a different search term.'
                                : 'Add products to fill invoice line items faster.'
                        }
                        actionLabel={search ? undefined : 'Add product'}
                        onAction={search ? undefined : openAdd}
                    />
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
                    <ListRow
                        title={item.name}
                        subtitle={item.description || undefined}
                        onPress={() => openEdit(item)}
                        onLongPress={() => setDeleteId(item.id)}
                        right={
                            <Text style={styles.price}>
                                {formatCurrency(item.price ?? item.unitPrice ?? 0)}
                            </Text>
                        }
                        last={index === products.length - 1}
                    />
                )}
            />
            <FAB onPress={openAdd} label="Add" />
            <BottomSheet ref={sheetRef} snapPoints={['58%']} onClose={() => setForm(EMPTY)}>
                <Text style={styles.sheetTitle}>{editing ? 'Edit product' : 'New product'}</Text>
                <Label required>Name</Label>
                <Input value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <View style={styles.fieldGap} />
                <Label>Description</Label>
                <Input
                    value={form.description}
                    onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                    multiline
                    style={{ minHeight: 72, textAlignVertical: 'top' }}
                />
                <View style={styles.fieldGap} />
                <Label required>Price</Label>
                <Input
                    value={form.price}
                    onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                    keyboardType="decimal-pad"
                />
                <Button
                    title={editing ? 'Save changes' : 'Add product'}
                    onPress={handleSave}
                    loading={saving}
                    style={{ marginTop: spacing.xxl }}
                />
                <Button title="Cancel" variant="secondary" onPress={closeSheet} style={{ marginTop: spacing.sm }} />
            </BottomSheet>
            <ConfirmModal
                visible={Boolean(deleteId)}
                title="Delete product?"
                message="This product will be removed from your catalog."
                confirmLabel="Delete"
                danger
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    list: { paddingBottom: 100, flexGrow: 1 },
    padX: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight },
    fieldGap: { height: spacing.lg },
    price: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.foreground,
        letterSpacing: -0.2,
    },
    sheetTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        marginBottom: spacing.xl,
        color: colors.foreground,
        letterSpacing: -0.3,
    },
});
