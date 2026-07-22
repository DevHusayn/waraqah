import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users } from 'lucide-react-native';
import { getBusinessInitials } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { PaginationBar } from '../components/PaginationBar';
import {
    AvatarInitials,
    BottomSheet,
    Button,
    EmptyState,
    Input,
    Label,
    ListRow,
    PageLoader,
    SearchBar,
} from '../components/ui';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../api/client';
import { buildListQuery } from '../utils/pagination';
import { colors, fontFamily, fontSize, shadows, spacing } from '../theme';

const EMPTY = { name: '', business: '', email: '', phone: '', address: '' };
const mapClient = (c) => ({ ...c, id: c._id || c.id });

export function ClientsScreen() {
    const { addClient, updateClient, deleteClient } = useInvoice();
    const { showToast } = useToast();
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const sheetRef = useRef(null);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/clients?${buildListQuery({ page, limit, search })}`),
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

    const clients = data.map(mapClient);

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
            showToast('Name is required', 'error');
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
            await refresh();
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
            await refresh();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    if (loading && !refreshing && clients.length === 0 && !search) return <PageLoader />;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <FlatList
                data={clients}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.titleRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pageTitle}>Clients</Text>
                                <Text style={styles.pageSub}>People and businesses you invoice</Text>
                            </View>
                            <Pressable
                                onPress={openAdd}
                                style={styles.addBtn}
                                accessibilityRole="button"
                                accessibilityLabel="Add client"
                            >
                                <Text style={styles.addBtnText}>Add</Text>
                            </Pressable>
                        </View>
                        <View style={styles.padX}>
                            <SearchBar value={search} onChangeText={setSearch} placeholder="Search clients…" />
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.cardShell, shadows.soft]}>
                        <EmptyState
                            icon={Users}
                            title={search ? 'No matching clients' : 'No clients yet'}
                            message={
                                search
                                    ? 'Try a different search term.'
                                    : 'Add your first client to start invoicing.'
                            }
                            actionLabel={search ? undefined : 'Add client'}
                            onAction={search ? undefined : openAdd}
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
                            index === clients.length - 1 && styles.rowLast,
                            index === 0 && shadows.soft,
                        ]}
                    >
                        <ListRow
                            title={item.name}
                            subtitle={[item.business || item.company, item.email].filter(Boolean).join(' · ')}
                            onPress={() => openEdit(item)}
                            onLongPress={() => setDeleteId(item.id)}
                            left={<AvatarInitials initials={getBusinessInitials(item.name)} />}
                            last={index === clients.length - 1}
                        />
                    </View>
                )}
            />
            <BottomSheet ref={sheetRef} snapPoints={['72%']} onClose={() => setForm(EMPTY)}>
                <Text style={styles.sheetTitle}>{editing ? 'Edit client' : 'New client'}</Text>
                <Label required>Name</Label>
                <Input value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <View style={styles.fieldGap} />
                <Label>Business</Label>
                <Input value={form.business} onChangeText={(v) => setForm((f) => ({ ...f, business: v }))} />
                <View style={styles.fieldGap} />
                <Label>Email</Label>
                <Input
                    value={form.email}
                    onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <View style={styles.fieldGap} />
                <Label>Phone</Label>
                <Input
                    value={form.phone}
                    onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                    keyboardType="phone-pad"
                />
                <View style={styles.fieldGap} />
                <Label>Address</Label>
                <Input
                    value={form.address}
                    onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                    multiline
                    style={{ minHeight: 72, textAlignVertical: 'top' }}
                />
                <Button title="Save" onPress={handleSave} loading={saving} style={{ marginTop: spacing.xxl }} />
                <Button title="Cancel" variant="secondary" onPress={closeSheet} style={{ marginTop: spacing.sm }} />
            </BottomSheet>
            <ConfirmModal
                visible={Boolean(deleteId)}
                title="Delete client?"
                message="This cannot be undone."
                confirmLabel="Delete"
                danger
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surfaceMuted },
    list: { paddingBottom: 110, flexGrow: 1 },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    pageTitle: {
        fontFamily: fontFamily.bold,
        fontSize: 30,
        color: colors.foreground,
        letterSpacing: -0.8,
    },
    pageSub: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        marginTop: 4,
    },
    addBtn: {
        marginTop: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: colors.brand,
    },
    addBtnText: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.white,
    },
    padX: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
    cardShell: {
        marginHorizontal: spacing.xl,
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
    fieldGap: { height: spacing.lg },
    sheetTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        marginBottom: spacing.xl,
        color: colors.foreground,
        letterSpacing: -0.3,
    },
});
