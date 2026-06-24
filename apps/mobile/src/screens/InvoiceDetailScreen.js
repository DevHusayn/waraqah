import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import {
    formatCurrency,
    getDisplayNumber,
    getPaymentMethodLabel,
    getReceiptNumber,
    isReceipt,
    MARK_PAID_METHODS,
} from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { BottomSheet, Button, Card, PageLoader, StatusBadge, Subtitle, Title } from '../components/ui';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export function InvoiceDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const { invoices, clients, updateInvoice, deleteInvoice, loading } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [pdfLoading, setPdfLoading] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [saving, setSaving] = useState(false);
    const markPaidSheetRef = useRef(null);

    const invoice = useMemo(() => invoices.find((i) => i.id === id), [invoices, id]);
    const client = useMemo(() => clients.find((c) => c.id === invoice?.clientId), [clients, invoice]);

    useEffect(() => {
        if (!loading && !invoice) navigation.goBack();
    }, [loading, invoice, navigation]);

    if (loading || !invoice) return <PageLoader />;

    const paid = isReceipt(invoice);
    const cancelled = invoice.status === 'cancelled';
    const canMarkPaid = ['pending', 'overdue'].includes(invoice.status);
    const canEdit = !paid && !cancelled;

    const handleDownload = async (mode) => {
        if (!client) {
            showToast('Client not found', 'error');
            return;
        }
        setPdfLoading(mode);
        try {
            const { shareInvoicePdf } = await import('../pdf/sharePdf');
            await shareInvoicePdf(invoice, client, businessInfo, mode);
            showToast(mode === 'receipt' ? 'Receipt ready to share' : 'Invoice ready to share', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to generate PDF', 'error');
        } finally {
            setPdfLoading(null);
        }
    };

    const handleMarkPaid = async () => {
        setSaving(true);
        try {
            await updateInvoice(id, {
                ...invoice,
                status: 'paid',
                paymentMethod,
                datePaid: format(new Date(), 'yyyy-MM-dd'),
            });
            markPaidSheetRef.current?.close();
            showToast('Invoice marked as paid', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        setSaving(true);
        try {
            await updateInvoice(id, { ...invoice, status: 'cancelled' });
            setConfirmCancel(false);
            showToast('Invoice cancelled', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteInvoice(id);
            setConfirmDelete(false);
            showToast('Invoice deleted', 'success');
            navigation.goBack();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <>
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <Title>{getDisplayNumber(invoice)}</Title>
                        <Subtitle>{client?.name}</Subtitle>
                    </View>
                    <StatusBadge status={invoice.status} />
                </View>

                <Card style={styles.block} elevated>
                    <Row label="Issue date" value={format(new Date(invoice.date), 'MMM d, yyyy')} />
                    <Row label="Due date" value={format(new Date(invoice.dueDate), 'MMM d, yyyy')} />
                    {paid ? (
                        <>
                            <Row label="Paid on" value={invoice.datePaid ? format(new Date(invoice.datePaid), 'MMM d, yyyy') : '—'} />
                            <Row label="Payment" value={getPaymentMethodLabel(invoice.paymentMethod)} />
                            <Row label="Receipt #" value={getReceiptNumber(invoice)} />
                        </>
                    ) : null}
                </Card>

                <Card style={styles.block} elevated>
                    <Text style={styles.section}>Line items</Text>
                    {(invoice.items || []).map((item, i) => (
                        <View key={i} style={styles.lineItem}>
                            <Text style={styles.lineDesc}>{item.description}</Text>
                            <Text style={styles.lineMeta}>
                                {item.quantity} × {formatCurrency(item.rate)} = {formatCurrency(item.quantity * item.rate)}
                            </Text>
                        </View>
                    ))}
                    <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                    <Row label={`Tax (${invoice.taxRate}%)`} value={formatCurrency(invoice.tax)} />
                    <Row label="Total" value={formatCurrency(invoice.total)} bold />
                </Card>

                {invoice.notes ? (
                    <Card style={styles.block} elevated>
                        <Text style={styles.section}>Notes</Text>
                        <Text style={styles.notes}>{invoice.notes}</Text>
                    </Card>
                ) : null}

                {canEdit ? (
                    <Card style={styles.block} elevated>
                        <Button title="Cancel invoice" variant="secondary" onPress={() => setConfirmCancel(true)} style={{ marginBottom: spacing.sm }} />
                        <Button title="Delete invoice" variant="danger" onPress={() => setConfirmDelete(true)} />
                    </Card>
                ) : null}
            </ScrollView>

            <View style={styles.actionBar}>
                {canMarkPaid ? (
                    <Button title="Mark paid" onPress={() => markPaidSheetRef.current?.snapToIndex(0)} style={styles.actionBtn} />
                ) : null}
                <Button
                    title="Share PDF"
                    variant="secondary"
                    onPress={() => handleDownload(paid ? 'receipt' : 'invoice')}
                    loading={pdfLoading === (paid ? 'receipt' : 'invoice')}
                    style={styles.actionBtn}
                />
                {canEdit ? (
                    <Button title="Edit" variant="secondary" onPress={() => navigation.navigate('CreateInvoice', { id })} style={styles.actionBtn} />
                ) : null}
            </View>

            <BottomSheet ref={markPaidSheetRef} snapPoints={['45%']}>
                <Text style={styles.section}>Payment method</Text>
                {MARK_PAID_METHODS.map((m) => (
                    <Pressable key={m.value} onPress={() => setPaymentMethod(m.value)} style={[styles.method, paymentMethod === m.value && styles.methodActive]}>
                        <Text style={styles.methodText}>{m.label}</Text>
                    </Pressable>
                ))}
                <Button title="Confirm payment" onPress={handleMarkPaid} loading={saving} style={{ marginTop: spacing.lg }} />
            </BottomSheet>

            <ConfirmModal visible={confirmDelete} title="Delete invoice?" message="This cannot be undone." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
            <ConfirmModal visible={confirmCancel} title="Cancel invoice?" message="The invoice will be marked cancelled." confirmLabel="Cancel invoice" onConfirm={handleCancel} onCancel={() => setConfirmCancel(false)} />
        </>
    );
}

function Row({ label, value, bold }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: 100 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
    block: { marginBottom: spacing.md },
    section: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, marginBottom: spacing.sm, color: colors.foreground },
    lineItem: { marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
    lineDesc: { fontFamily: fontFamily.semibold, color: colors.foreground },
    lineMeta: { fontFamily: fontFamily.regular, color: colors.muted, marginTop: 2, fontSize: fontSize.xs },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    rowLabel: { fontFamily: fontFamily.regular, color: colors.muted, fontSize: fontSize.sm },
    rowValue: { fontFamily: fontFamily.medium, color: colors.foreground },
    rowBold: { fontFamily: fontFamily.bold, fontWeight: '700' },
    notes: { fontFamily: fontFamily.regular, color: colors.slate600, lineHeight: 20 },
    actionBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionBtn: { flex: 1, minWidth: '45%' },
    method: { padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
    methodActive: { borderColor: colors.brand, backgroundColor: colors.brandSubtle },
    methodText: { fontFamily: fontFamily.medium, color: colors.foreground },
});
