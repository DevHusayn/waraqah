import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Spinner } from '../components/Spinner';
import { Button, Card, StatusBadge, Subtitle, Title } from '../components/ui';
import { ConfirmModal } from '../components/Modal';
import { colors } from '../theme/colors';

export function InvoiceDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const { invoices, clients, updateInvoice, deleteInvoice, loading } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [pdfLoading, setPdfLoading] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [saving, setSaving] = useState(false);

    const invoice = useMemo(() => invoices.find((i) => i.id === id), [invoices, id]);
    const client = useMemo(() => clients.find((c) => c.id === invoice?.clientId), [clients, invoice]);

    useEffect(() => {
        if (!loading && !invoice) navigation.goBack();
    }, [loading, invoice, navigation]);

    if (loading || !invoice) return <Spinner />;

    const paid = isReceipt(invoice);
    const cancelled = invoice.status === 'cancelled';
    const canMarkPaid = ['pending', 'overdue'].includes(invoice.status);
    const canEdit = !paid && !cancelled;

    const handleDownload = async (mode) => {
        if (!client) {
            Alert.alert('Error', 'Client not found');
            return;
        }
        setPdfLoading(mode);
        try {
            const { shareInvoicePdf } = await import('../pdf/sharePdf');
            await shareInvoicePdf(invoice, client, businessInfo, mode);
            showToast(mode === 'receipt' ? 'Receipt ready to share' : 'Invoice ready to share', 'success');
        } catch (err) {
            Alert.alert('PDF error', err.message || 'Failed to generate PDF');
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
            setMarkPaidOpen(false);
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
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Title>{getDisplayNumber(invoice)}</Title>
                    <Subtitle>{client?.name}</Subtitle>
                </View>
                <StatusBadge status={invoice.status} />
            </View>

            <Card style={styles.block}>
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

            <Card style={styles.block}>
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
                <Card style={styles.block}>
                    <Text style={styles.section}>Notes</Text>
                    <Text style={styles.notes}>{invoice.notes}</Text>
                </Card>
            ) : null}

            <Card style={styles.block}>
                {canMarkPaid ? <Button title="Mark as paid" onPress={() => setMarkPaidOpen(true)} style={styles.action} /> : null}
                {paid ? (
                    <>
                        <Button title="Share invoice PDF" variant="secondary" onPress={() => handleDownload('invoice')} loading={pdfLoading === 'invoice'} style={styles.action} />
                        <Button title="Share receipt PDF" onPress={() => handleDownload('receipt')} loading={pdfLoading === 'receipt'} style={styles.action} />
                    </>
                ) : (
                    <Button title="Share invoice PDF" variant="secondary" onPress={() => handleDownload('invoice')} loading={pdfLoading === 'invoice'} style={styles.action} />
                )}
                {canEdit ? (
                    <>
                        <Button title="Edit" variant="secondary" onPress={() => navigation.navigate('CreateInvoice', { id })} style={styles.action} />
                        <Button title="Cancel invoice" variant="secondary" onPress={() => setConfirmCancel(true)} style={styles.action} />
                        <Button title="Delete" variant="danger" onPress={() => setConfirmDelete(true)} style={styles.action} />
                    </>
                ) : null}
            </Card>

            <ConfirmModal visible={confirmDelete} title="Delete invoice?" message="This cannot be undone." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
            <ConfirmModal visible={confirmCancel} title="Cancel invoice?" message="The invoice will be marked cancelled." confirmLabel="Cancel invoice" onConfirm={handleCancel} onCancel={() => setConfirmCancel(false)} />

            <Modal visible={markPaidOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.section}>Payment method</Text>
                        {MARK_PAID_METHODS.map((m) => (
                            <Pressable key={m.value} onPress={() => setPaymentMethod(m.value)} style={[styles.method, paymentMethod === m.value && styles.methodActive]}>
                                <Text>{m.label}</Text>
                            </Pressable>
                        ))}
                        <Button title="Confirm payment" onPress={handleMarkPaid} loading={saving} style={{ marginTop: 12 }} />
                        <Button title="Close" variant="secondary" onPress={() => setMarkPaidOpen(false)} style={{ marginTop: 8 }} />
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

function Row({ label, value, bold }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, bold && { fontWeight: '700' }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    content: { padding: 16, paddingBottom: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    block: { marginBottom: 12 },
    section: { fontWeight: '700', fontSize: 15, marginBottom: 8, color: colors.slate900 },
    lineItem: { marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
    lineDesc: { fontWeight: '600', color: colors.slate900 },
    lineMeta: { color: colors.slate500, marginTop: 2, fontSize: 13 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    rowLabel: { color: colors.slate500 },
    rowValue: { color: colors.slate900, fontWeight: '500' },
    notes: { color: colors.slate600, lineHeight: 20 },
    action: { marginBottom: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
    method: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.slate200, marginBottom: 6 },
    methodActive: { borderColor: colors.brand, backgroundColor: colors.brandSubtle },
});
