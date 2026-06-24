import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import {
    APP_CURRENCY,
    buildInvoiceFieldErrors,
    buildDraftFieldErrors,
    formatCurrency,
    DRAFT_STATUS,
} from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';
import { Button, Card, FieldError, Input, Label } from '../components/ui';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { colors, fontFamily, fontSize, spacing } from '../theme';

const emptyItem = () => ({ description: '', quantity: '1', rate: '0' });

function Section({ title, open, onToggle, children }) {
    return (
        <Card style={styles.block} elevated>
            <Pressable onPress={onToggle} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {open ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
            </Pressable>
            {open ? <View style={styles.sectionBody}>{children}</View> : null}
        </Card>
    );
}

export function CreateInvoiceScreen({ route, navigation }) {
    const editId = route.params?.id;
    const { clients, invoices, products, addInvoice, updateInvoice } = useInvoice();
    const { showToast } = useToast();
    const limitModalRef = useRef(null);
    const { invoiceUsage, tryCreate, goUpgrade } = useInvoiceCreateGuard(limitModalRef, navigation);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [openSections, setOpenSections] = useState({ details: true, items: true, notes: false });
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

    const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

    const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

    const setItem = (index, key, value) => {
        setForm((f) => {
            const items = [...f.items];
            items[index] = { ...items[index], [key]: value };
            return { ...f, items };
        });
    };

    const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (index) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

    const addProductAsItem = (product) => {
        setForm((f) => ({
            ...f,
            items: [
                ...f.items.filter((it) => it.description.trim()),
                {
                    description: product.name,
                    quantity: '1',
                    rate: String(product.price ?? 0),
                },
            ],
        }));
        showToast(`Added ${product.name}`, 'success');
    };

    const computeTotals = () => {
        const subtotal = form.items.reduce(
            (s, it) => s + Number(it.quantity || 0) * Number(it.rate || 0),
            0
        );
        const taxRate = Number(form.taxRate || 0);
        const tax = subtotal * (taxRate / 100);
        return { subtotal, tax, total: subtotal + tax, taxRate };
    };

    const buildPayload = (asDraft = false) => ({
        ...form,
        status: asDraft ? DRAFT_STATUS : form.status === DRAFT_STATUS ? 'pending' : form.status,
        items: form.items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity),
            rate: Number(it.rate),
        })),
        ...computeTotals(),
    });

    const persist = async (asDraft = false) => {
        if (!asDraft && !editId && !tryCreate(() => {})) return;

        const payload = buildPayload(asDraft);
        const errors = asDraft ? buildDraftFieldErrors(payload) : buildInvoiceFieldErrors(payload);
        setFieldErrors(errors);
        if (Object.values(errors).some(Boolean)) {
            showToast('Please fix the highlighted fields', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editId) {
                await updateInvoice(editId, payload);
                showToast(asDraft ? 'Draft saved' : 'Invoice updated', 'success');
            } else {
                await addInvoice(payload);
                showToast(asDraft ? 'Draft saved' : 'Invoice created', 'success');
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
                <Text style={styles.heading}>No clients yet</Text>
                <Text style={styles.hint}>Add a client before creating an invoice.</Text>
                <Button title="Go to clients" onPress={() => navigation.getParent()?.navigate('Clients')} />
            </View>
        );
    }

    const { subtotal, tax, total } = computeTotals();

    return (
        <>
            <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Section title="Invoice details" open={openSections.details} onToggle={() => toggleSection('details')}>
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
                    <Label required>Issue date</Label>
                    <Input value={form.date} onChangeText={(v) => setField('date', v)} error={fieldErrors.date} />
                    <FieldError message={fieldErrors.date} />
                    <Label required>Due date</Label>
                    <Input value={form.dueDate} onChangeText={(v) => setField('dueDate', v)} error={fieldErrors.dueDate} />
                    <FieldError message={fieldErrors.dueDate} />
                    <Label required>Tax rate (%)</Label>
                    <Input value={form.taxRate} onChangeText={(v) => setField('taxRate', v)} keyboardType="decimal-pad" error={fieldErrors.taxRate} />
                    <FieldError message={fieldErrors.taxRate} />
                </Section>

                {products.length > 0 ? (
                    <Card style={styles.block} elevated>
                        <Text style={styles.sectionTitle}>Add from products</Text>
                        <View style={styles.clientList}>
                            {products.slice(0, 8).map((p) => (
                                <Pressable key={p.id} onPress={() => addProductAsItem(p)} style={styles.productChip}>
                                    <Text style={styles.chipText}>{p.name}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </Card>
                ) : null}

                <Section title="Line items" open={openSections.items} onToggle={() => toggleSection('items')}>
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
                                <Button title="Remove item" variant="danger" onPress={() => removeItem(index)} style={{ marginTop: spacing.sm }} />
                            ) : null}
                        </View>
                    ))}
                    <Button title="Add item" variant="secondary" onPress={addItem} />
                </Section>

                <Section title="Notes & totals" open={openSections.notes} onToggle={() => toggleSection('notes')}>
                    <Label>Notes</Label>
                    <Input value={form.notes} onChangeText={(v) => setField('notes', v)} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
                    <View style={styles.totals}>
                        <Text style={styles.totalLine}>Subtotal: {formatCurrency(subtotal)}</Text>
                        <Text style={styles.totalLine}>Tax: {formatCurrency(tax)}</Text>
                        <Text style={styles.totalBold}>Total: {formatCurrency(total)}</Text>
                    </View>
                </Section>

                <Button title={editId ? 'Save changes' : 'Create invoice'} onPress={() => persist(false)} loading={saving} />
                <Button title="Save as draft" variant="secondary" onPress={() => persist(true)} disabled={saving} style={{ marginTop: spacing.sm }} />
            </ScrollView>
            <InvoiceLimitModal ref={limitModalRef} usage={invoiceUsage} onUpgrade={goUpgrade} />
        </>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    pad: { flex: 1, padding: spacing.lg, backgroundColor: colors.surfaceMuted },
    heading: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.foreground },
    hint: { fontFamily: fontFamily.regular, color: colors.muted, marginVertical: spacing.md },
    block: { marginBottom: spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.foreground },
    sectionBody: { marginTop: spacing.md },
    clientList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
    clientChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    clientChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
    productChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.brandLight, backgroundColor: colors.brandSubtle },
    chipText: { fontFamily: fontFamily.medium, color: colors.slate700, fontSize: fontSize.sm },
    chipActiveText: { fontFamily: fontFamily.semibold, color: colors.white },
    itemBlock: { marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
    row: { flexDirection: 'row', gap: spacing.sm },
    totals: { marginTop: spacing.md, gap: 4 },
    totalLine: { fontFamily: fontFamily.regular, color: colors.muted, fontSize: fontSize.sm },
    totalBold: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.foreground, marginTop: 4 },
});
