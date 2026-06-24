import { useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { getBusinessInitials } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import {
    AvatarInitials,
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
import { colors, fontFamily, fontSize, spacing } from '../theme';

const EMPTY = { name: '', business: '', email: '', phone: '', address: '' };

export function ClientsScreen() {
    const { clients, addClient, updateClient, deleteClient, loading, fetchUserData } = useInvoice();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const sheetRef = useRef(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return clients;
        return clients.filter(
            (c) =>
                c.name?.toLowerCase().includes(q) ||
                c.business?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q)
        );
    }, [clients, search]);

    const openAdd = () => {
        setEditing(null);
        setForm(EMPTY);
        sheetRef.current?.snapToIndex(0);
    };

    const openEdit = (client) => {
        setEditing(client);
        setForm({
            name: client.name || '',
            business: client.business || client.company || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
        });
        sheetRef.current?.snapToIndex(0);
    };

    const closeSheet = () => sheetRef.current?.close();

    const handleSave = async () => {
        if (!form.name.trim()) {
            showToast('Business name is required', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await updateClient(editing.id, form);
                showToast('Client updated', 'success');
            } else {
                await addClient(form);
                showToast('Client added', 'success');
            }
            closeSheet();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteClient(deleteId);
            setDeleteId(null);
            showToast('Client deleted', 'success');
        } catch (err) {
            showToast(err.message, 'error');
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
                        <PageHeader title="Clients" subtitle="Manage your client list" />
                        <SearchBar value={search} onChangeText={setSearch} placeholder="Search clients…" style={{ marginTop: 0 }} />
                    </>
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={Users}
                        title="No clients"
                        message="Add your first client to start invoicing"
                        action={<Button title="Add client" onPress={openAdd} style={{ marginTop: spacing.md }} />}
                    />
                }
                renderItem={({ item }) => (
                    <ListRow
                        title={item.name}
                        subtitle={[item.business, item.email].filter(Boolean).join(' · ')}
                        onPress={() => openEdit(item)}
                        onLongPress={() => setDeleteId(item.id)}
                        left={<AvatarInitials initials={getBusinessInitials(item.name)} />}
                    />
                )}
            />
            <FAB onPress={openAdd} label="Add" />
            <BottomSheet ref={sheetRef} snapPoints={['70%']} onClose={() => setForm(EMPTY)}>
                <Text style={styles.sheetTitle}>{editing ? 'Edit client' : 'New client'}</Text>
                <Label required>Name</Label>
                <Input value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Label>Business</Label>
                <Input value={form.business} onChangeText={(v) => setForm((f) => ({ ...f, business: v }))} />
                <Label>Email</Label>
                <Input value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
                <Label>Phone</Label>
                <Input value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
                <Label>Address</Label>
                <Input value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />
                <Button title="Save" onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
                <Button title="Cancel" variant="secondary" onPress={closeSheet} style={{ marginTop: spacing.sm }} />
            </BottomSheet>
            <ConfirmModal visible={Boolean(deleteId)} title="Delete client?" message="This cannot be undone." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    list: { padding: spacing.lg, paddingBottom: 100, flexGrow: 1 },
    sheetTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, marginBottom: spacing.lg, color: colors.foreground },
});
