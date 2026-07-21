import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { BottomSheet, Button, PageLoader, StatusBadge } from '../components/ui';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../theme';

export function InvoiceDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const insets = useSafeAreaInsets();
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
        <View style={styles.root}>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.number}>{getDisplayNumber(invoice)}</Text>
                        <Text style={styles.client}>{client?.name || 'No client'}</Text>
                    </View>
                    <StatusBadge status={invoice.status} />
                </View>

                <Text style={styles.amountHero}>{formatCurrency(invoice.total)}</Text>
                <Text style={styles.amountHint}>Total</Text>

                <Text style={styles.section}>Details</Text>
                <View style={styles.group}>
                    <MetaRow label="Issue date" value={format(new Date(invoice.date), 'MMM d, yyyy')} />
                    <MetaRow label="Due date" value={format(new Date(invoice.dueDate), 'MMM d, yyyy')} />
                    {paid ? (
                        <>
                            <MetaRow
                                label="Paid on"
                                value={invoice.datePaid ? format(new Date(invoice.datePaid), 'MMM d, yyyy') : '—'}
                            />
                            <MetaRow label="Payment" value={getPaymentMethodLabel(invoice.paymentMethod)} />
                            <MetaRow label="Receipt #" value={getReceiptNumber(invoice)} last />
                        </>
                    ) : (
                        <View style={styles.lastPad} />
                    )}
                </View>

                <Text style={styles.section}>Line items</Text>
                <View style={styles.group}>
                    {(invoice.items || []).map((item, i, arr) => (
                        <View
                            key={i}
                            style={[styles.lineItem, i < arr.length - 1 && styles.lineBorder]}
                        >
                            <Text style={styles.lineDesc}>{item.description}</Text>
                            <Text style={styles.lineMeta}>
                                {item.quantity} × {formatCurrency(item.rate)}
                            </Text>
                            <Text style={styles.lineTotal}>{formatCurrency(item.quantity * item.rate)}</Text>
                        </View>
                    ))}
                    <MetaRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                    <MetaRow label={`Tax (${invoice.taxRate}%)`} value={formatCurrency(invoice.tax)} />
                    <MetaRow label="Total" value={formatCurrency(invoice.total)} bold last />
                </View>

                {invoice.notes ? (
                    <>
                        <Text style={styles.section}>Notes</Text>
                        <Text style={styles.notes}>{invoice.notes}</Text>
                    </>
                ) : null}

                {canEdit ? (
                    <View style={styles.dangerZone}>
                        <Button title="Cancel invoice" variant="secondary" onPress={() => setConfirmCancel(true)} />
                        <Button
                            title="Delete invoice"
                            variant="danger"
                            onPress={() => setConfirmDelete(true)}
                            style={{ marginTop: spacing.sm }}
                        />
                    </View>
                ) : null}
            </ScrollView>

            <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
                {canMarkPaid ? (
                    <Button title="Mark paid" onPress={() => markPaidSheetRef.current?.snapToIndex(0)} style={styles.actionBtn} />
                ) : null}
                <Button
                    title="Share"
                    variant="secondary"
                    onPress={() => handleDownload(paid ? 'receipt' : 'invoice')}
                    loading={pdfLoading === (paid ? 'receipt' : 'invoice')}
                    style={styles.actionBtn}
                />
                {canEdit ? (
                    <Button
                        title="Edit"
                        variant="secondary"
                        onPress={() => navigation.navigate('CreateInvoice', { id })}
                        style={styles.actionBtn}
                    />
                ) : null}
            </View>

            <BottomSheet ref={markPaidSheetRef} snapPoints={['48%']}>
                <Text style={styles.sheetTitle}>Payment method</Text>
                {MARK_PAID_METHODS.map((m) => (
                    <Pressable
                        key={m.value}
                        onPress={() => setPaymentMethod(m.value)}
                        style={[styles.method, paymentMethod === m.value && styles.methodActive]}
                    >
                        <Text style={styles.methodText}>{m.label}</Text>
                    </Pressable>
                ))}
                <Button title="Confirm payment" onPress={handleMarkPaid} loading={saving} style={{ marginTop: spacing.lg }} />
            </BottomSheet>

            <ConfirmModal
                visible={confirmDelete}
                title="Delete invoice?"
                message="This cannot be undone."
                confirmLabel="Delete"
                danger
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
            <ConfirmModal
                visible={confirmCancel}
                title="Cancel invoice?"
                message="The invoice will be marked cancelled."
                confirmLabel="Cancel invoice"
                onConfirm={handleCancel}
                onCancel={() => setConfirmCancel(false)}
            />
        </View>
    );
}

function MetaRow({ label, value, bold, last }) {
    return (
        <View style={[styles.metaRow, !last && styles.metaBorder]}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={[styles.metaValue, bold && styles.metaBold]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    screen: { flex: 1 },
    content: { paddingTop: spacing.lg },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    number: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.foreground,
        letterSpacing: -0.4,
    },
    client: {
        marginTop: 4,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
    },
    amountHero: {
        paddingHorizontal: spacing.xl,
        fontFamily: fontFamily.bold,
        fontSize: 34,
        color: colors.foreground,
        letterSpacing: -1,
    },
    amountHint: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xxl,
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.muted,
    },
    section: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
        fontFamily: fontFamily.semibold,
        fontSize: 12,
        color: colors.slate400,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    group: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        gap: spacing.md,
    },
    metaBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderLight,
    },
    metaLabel: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
    },
    metaValue: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: colors.foreground,
        textAlign: 'right',
        flexShrink: 1,
    },
    metaBold: {
        fontFamily: fontFamily.bold,
        fontWeight: '700',
    },
    lastPad: { height: 0 },
    lineItem: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
    },
    lineBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderLight,
    },
    lineDesc: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.md,
        color: colors.foreground,
    },
    lineMeta: {
        marginTop: 2,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
    },
    lineTotal: {
        marginTop: 4,
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.foreground,
    },
    notes: {
        paddingHorizontal: spacing.xl,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.slate600,
        lineHeight: lineHeight.md,
    },
    dangerZone: {
        paddingHorizontal: spacing.xl,
        marginTop: spacing.xxl,
    },
    actionBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    actionBtn: { flex: 1, minWidth: '30%' },
    sheetTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        marginBottom: spacing.lg,
    },
    method: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    methodActive: {
        borderColor: colors.brand,
        backgroundColor: colors.brandSubtle,
    },
    methodText: {
        fontFamily: fontFamily.medium,
        color: colors.foreground,
        fontSize: fontSize.md,
    },
});
