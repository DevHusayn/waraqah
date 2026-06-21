import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { getBusinessInitials } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';
import { Button, Card, EmptyState, Label, Input, Title } from '../components/ui';
import { ConfirmModal } from '../components/Modal';
import { colors } from '../theme/colors';

const EMPTY = { name: '', business: '', email: '', phone: '', address: '' };

export function ClientsScreen() {
    const { clients, addClient, updateClient, deleteClient, loading, fetchUserData } = useInvoice();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [deleteId, setDeleteId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
        setModalOpen(true);
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
        setModalOpen(true);
    };

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
            setModalOpen(false);
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

    if (loading && !refreshing) return <Spinner />;

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Title>Clients</Title>
                <TextInput
                    placeholder="Search clients…"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.search}
                    placeholderTextColor={colors.slate400}
                />
                <Button title="Add client" onPress={openAdd} style={{ marginTop: 10 }} />
            </View>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
                ListEmptyComponent={<EmptyState title="No clients" message="Add your first client" action={<Button title="Add client" onPress={openAdd} style={{ marginTop: 12 }} />} />}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <View style={styles.avatarRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{getBusinessInitials(item.name)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{item.name}</Text>
                                {item.business ? <Text style={styles.meta}>{item.business}</Text> : null}
                                {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
                            </View>
                        </View>
                        <View style={styles.actions}>
                            <Button title="Edit" variant="secondary" onPress={() => openEdit(item)} style={styles.actionBtn} />
                            <Button title="Delete" variant="danger" onPress={() => setDeleteId(item.id)} style={styles.actionBtn} />
                        </View>
                    </Card>
                )}
            />

            <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>{editing ? 'Edit client' : 'New client'}</Text>
                    <Label required>Name</Label>
                    <Input value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                    <Label>Business</Label>
                    <Input value={form.business} onChangeText={(v) => setForm((f) => ({ ...f, business: v }))} />
                    <Label>Email</Label>
                    <Input value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
                    <Label>Phone</Label>
                    <Input value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
                    <Label>Address</Label>
                    <Input value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} multiline />
                    <Button title="Save" onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
                    <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={{ marginTop: 8 }} />
                </View>
            </Modal>

            <ConfirmModal visible={Boolean(deleteId)} title="Delete client?" message="This cannot be undone." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    header: { padding: 16, paddingBottom: 8 },
    search: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.slate200,
        borderRadius: 12,
        padding: 12,
        backgroundColor: colors.white,
        fontSize: 16,
    },
    list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
    card: { marginBottom: 10 },
    avatarRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brandLight, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: colors.brand, fontWeight: '800' },
    name: { fontWeight: '700', fontSize: 16, color: colors.slate900 },
    meta: { color: colors.slate500, fontSize: 13, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1 },
    modal: { flex: 1, padding: 20, paddingTop: 24, backgroundColor: colors.white },
    modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
});
