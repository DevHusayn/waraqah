import { useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { formatCurrency } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
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
import { colors, spacing } from '../theme';

const EMPTY = { name: '', description: '', price: '' };

function filterProducts(products, query) {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
}

export function ProductsScreen() {
    const { products, addProduct, updateProduct, deleteProduct, loading, fetchUserData } = useInvoice();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const sheetRef = useRef(null);

    const filtered = useMemo(() => filterProducts(products, search), [products, search]);

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
            price: String(product.price ?? ''),
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
            };
            if (editing) {
                await updateProduct(editing.id, payload);
                showToast('Product updated', 'success');
            } else {
                await addProduct(payload);
                showToast('Product added', 'success');
            }
            closeSheet();
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
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    if (loading && !refreshing) return <PageLoader />;

    return (
        <View style={styles.screen}>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
                ListHeaderComponent={
                    <>
                        <PageHeader title="Products" subtitle="Catalog for quick line items" />
                        <SearchBar value={search} onChangeText={setSearch} placeholder="Search products…" style={{ marginTop: 0 }} />
                    </>
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={Package}
                        title="No products"
                        message="Add products to fill invoice line items faster"
                        action={<Button title="Add product" onPress={openAdd} style={{ marginTop: spacing.md }} />}
                    />
                }
                renderItem={({ item }) => (
                    <ListRow
                        title={item.name}
                        subtitle={item.description || formatCurrency(item.price)}
                        onPress={() => openEdit(item)}
                        onLongPress={() => setDeleteId(item.id)}
                        right={<Text style={styles.price}>{formatCurrency(item.price)}</Text>}
                    />
                )}
            />
            <FAB onPress={openAdd} label="Add" />
            <BottomSheet ref={sheetRef} snapPoints={['55%']} onClose={() => setForm(EMPTY)}>
                <Text style={styles.sheetTitle}>{editing ? 'Edit product' : 'New product'}</Text>
                <Label required>Name</Label>
                <Input value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Label>Description</Label>
                <Input value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />
                <Label required>Price</Label>
                <Input value={form.price} onChangeText={(v) => setForm((f) => ({ ...f, price: v }))} keyboardType="decimal-pad" />
                <Button title={editing ? 'Save changes' : 'Add product'} onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
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
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    list: { padding: spacing.lg, paddingBottom: 100, flexGrow: 1 },
    price: { fontWeight: '600', color: colors.foreground },
    sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.lg, color: colors.foreground },
});
