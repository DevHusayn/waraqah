import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import {
    APP_CURRENCY,
    buildInvoiceFieldErrors,
    formatCurrency,
    canCreateInvoice,
} from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, FieldError, Input, Label, Title } from '../components/ui';
import { colors } from '../theme/colors';

const emptyItem = () => ({ description: '', quantity: '1', rate: '0' });

export function CreateInvoiceScreen({ route, navigation }) {
    const editId = route.params?.id;
    const { clients, invoices, addInvoice, updateInvoice, invoiceUsage } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState({
        invoiceNumber: '',
        clientId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
        items: [emptyItem()],
        notes: '',
        status: 'pending',
        currency: APP_CURRENCY,
        taxRate: '10',
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: '',
    });

    useEffect(() => {
        if (!editId) {
            apiFetch('/invoices/next-number')
                .then((d) => setForm((f) => ({ ...f, invoiceNumber: d.invoiceNumber || '' })))
                .catch(() => {});
            return;
        }
        const inv = invoices.find((i) => i.id === editId);
        if (inv) {
            setForm({
                ...inv,
                taxRate: String(inv.taxRate ?? 10),
                items: (inv.items || []).map((it) => ({
                    description: it.description || '',
                    quantity: String(it.quantity ?? 1),
                    rate: String(it.rate ?? 0),
                })),
            });
        }
    }, [editId, invoices]);

    const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

    const setItem = (index, key, value) => {
        setForm((f) => {
            const items = [...f.items];
            items[index] = { ...items[index], [key]: value };
            return { ...f, items };
        });
    };

    const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (index) =>
        setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

    const computeTotals = () => {
        const subtotal = form.items.reduce(
            (s, it) => s + Number(it.quantity || 0) * Number(it.rate || 0),
            0
        );
        const taxRate = Number(form.taxRate || 0);
        const tax = subtotal * (taxRate / 100);
        return { subtotal, tax, total: subtotal + tax, taxRate };
    };

    const handleSave = async () => {
        if (!editId && !canCreateInvoice(invoiceUsage)) {
            Alert.alert('Limit reached', 'Upgrade to Premium for unlimited invoices.');
            navigation.getParent()?.navigate('More', { screen: 'Upgrade' });
            return;
        }
        const payload = {
            ...form,
            items: form.items.map((it) => ({
                description: it.description,
                quantity: Number(it.quantity),
                rate: Number(it.rate),
            })),
            ...computeTotals(),
        };
        const errors = buildInvoiceFieldErrors(payload);
        setFieldErrors(errors);
        if (Object.values(errors).some(Boolean)) {
            showToast('Please fix the highlighted fields', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editId) {
                await updateInvoice(editId, payload);
                showToast('Invoice updated', 'success');
            } else {
                await addInvoice(payload);
                showToast('Invoice created', 'success');
            }
            navigation.goBack();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (clients.length === 0) {
        return (
            <View style={styles.pad}>
                <Title>No clients yet</Title>
                <Text style={styles.hint}>Add a client before creating an invoice.</Text>
                <Button title="Go to clients" onPress={() => navigation.getParent()?.navigate('Clients')} />
            </View>
        );
    }

    const { subtotal, tax, total } = computeTotals();

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Title>{editId ? 'Edit invoice' : 'New invoice'}</Title>

            <Card style={styles.block}>
                <Label required>Client</Label>
                <View style={styles.clientList}>
                    {clients.map((c) => (
                        <Pressable
                            key={c.id}
                            onPress={() => setField('clientId', c.id)}
                            style={[styles.clientChip, form.clientId === c.id && styles.clientChipActive]}
                        >
                            <Text style={form.clientId === c.id ? styles.chipActiveText : styles.chipText}>{c.name}</Text>
                        </Pressable>
                    ))}
                </View>
                <FieldError message={fieldErrors.clientId} />

                <Label>Invoice #</Label>
                <Input value={form.invoiceNumber} editable={false} />

                <Label required>Issue date (YYYY-MM-DD)</Label>
                <Input value={form.date} onChangeText={(v) => setField('date', v)} error={fieldErrors.date} />
                <FieldError message={fieldErrors.date} />

                <Label required>Due date (YYYY-MM-DD)</Label>
                <Input value={form.dueDate} onChangeText={(v) => setField('dueDate', v)} error={fieldErrors.dueDate} />
                <FieldError message={fieldErrors.dueDate} />

                <Label required>Tax rate (%)</Label>
                <Input value={form.taxRate} onChangeText={(v) => setField('taxRate', v)} keyboardType="decimal-pad" error={fieldErrors.taxRate} />
                <FieldError message={fieldErrors.taxRate} />
            </Card>

            <Card style={styles.block}>
                <Text style={styles.section}>Line items</Text>
                {form.items.map((item, index) => (
                    <View key={index} style={styles.itemBlock}>
                        <Label required>Description</Label>
                        <Input
                            value={item.description}
                            onChangeText={(v) => setItem(index, 'description', v)}
                            error={fieldErrors[`item-${index}-description`]}
                        />
                        <FieldError message={fieldErrors[`item-${index}-description`]} />
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Label required>Qty</Label>
                                <Input value={item.quantity} onChangeText={(v) => setItem(index, 'quantity', v)} keyboardType="number-pad" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Label required>Rate</Label>
                                <Input value={item.rate} onChangeText={(v) => setItem(index, 'rate', v)} keyboardType="decimal-pad" />
                            </View>
                        </View>
                        {form.items.length > 1 ? (
                            <Button title="Remove item" variant="danger" onPress={() => removeItem(index)} style={{ marginTop: 8 }} />
                        ) : null}
                    </View>
                ))}
                <Button title="Add item" variant="secondary" onPress={addItem} />
            </Card>

            <Card style={styles.block}>
                <Label>Notes</Label>
                <Input value={form.notes} onChangeText={(v) => setField('notes', v)} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
                <View style={styles.totals}>
                    <Text>Subtotal: {formatCurrency(subtotal)}</Text>
                    <Text>Tax: {formatCurrency(tax)}</Text>
                    <Text style={styles.totalBold}>Total: {formatCurrency(total)}</Text>
                </View>
            </Card>

            <Button title={editId ? 'Save changes' : 'Create invoice'} onPress={handleSave} loading={saving} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    content: { padding: 16, paddingBottom: 40 },
    pad: { flex: 1, padding: 16, backgroundColor: colors.slate50 },
    hint: { color: colors.slate500, marginVertical: 12 },
    block: { marginBottom: 12 },
    section: { fontWeight: '700', marginBottom: 8, color: colors.slate900 },
    clientList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    clientChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.slate200 },
    clientChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
    chipText: { color: colors.slate700 },
    chipActiveText: { color: colors.white, fontWeight: '600' },
    itemBlock: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
    row: { flexDirection: 'row', gap: 10 },
    totals: { marginTop: 12, gap: 4 },
    totalBold: { fontWeight: '700', fontSize: 16, marginTop: 4 },
});
