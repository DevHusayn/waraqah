import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import {
    canRecordInvoicePayment,
    formatCurrency,
    getDisplayNumber,
    getInvoiceAmountPaid,
    getInvoiceBalanceDue,
    getInvoicePayments,
    getPaymentMethodLabel,
    getReceiptNumber,
    hasRecordedPayments,
    isReceipt,
    MARK_PAID_METHODS,
    normalizeInvoiceUnit,
} from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { BottomSheet, Button, Input, PageLoader, StatusBadge } from '../components/ui';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../theme';

const MONEY_EPS = 0.009;

function amountsMatch(a, b) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < MONEY_EPS;
}

export function InvoiceDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const insets = useSafeAreaInsets();
    const { invoices, clients, updateInvoice, recordInvoicePayment, deleteInvoice, loading } =
        useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [pdfLoading, setPdfLoading] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paidFully, setPaidFully] = useState(true);
    const [saving, setSaving] = useState(false);
    const markPaidSheetRef = useRef(null);

    const invoice = useMemo(() => invoices.find((i) => i.id === id), [invoices, id]);
    const client = useMemo(() => clients.find((c) => c.id === invoice?.clientId), [clients, invoice]);

    const balanceDue = invoice ? getInvoiceBalanceDue(invoice) : 0;
    const amountPaid = invoice ? getInvoiceAmountPaid(invoice) : 0;
    const paymentHistory = invoice ? getInvoicePayments(invoice) : [];

    useEffect(() => {
        if (!loading && !invoice) navigation.goBack();
    }, [loading, invoice, navigation]);

    useEffect(() => {
        if (invoice) {
            setPaidFully(true);
            setPaymentAmount(balanceDue > 0 ? String(balanceDue) : '');
        }
    }, [invoice?.id, balanceDue]);

    if (loading || !invoice) return <PageLoader />;

    const paid = isReceipt(invoice);
    const cancelled = invoice.status === 'cancelled';
    const canMarkPaid = canRecordInvoicePayment(invoice);
    const canEdit = !paid && !cancelled && !hasRecordedPayments(invoice);
    const canCancel = ['pending', 'partial', 'overdue'].includes(invoice.status);

    const parsedAmount = Number(String(paymentAmount).replace(/,/g, '').trim());
    const amountNumber = paidFully ? balanceDue : parsedAmount;
    const isFullPayment = paidFully || amountsMatch(amountNumber, balanceDue);

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
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            showToast('Enter a payment amount greater than zero', 'error');
            return;
        }
        if (amountNumber > balanceDue + 0.009) {
            showToast(`Amount cannot exceed ${formatCurrency(balanceDue, invoice.currency)}`, 'error');
            return;
        }
        setSaving(true);
        try {
            const updated = await recordInvoicePayment(id, {
                amount: Math.min(amountNumber, balanceDue),
                paymentMethod,
                datePaid: new Date().toISOString(),
            });
            markPaidSheetRef.current?.close();
            showToast(
                updated.status === 'paid' ? 'Invoice marked as paid' : 'Payment recorded',
                'success'
            );
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

    const openPaymentSheet = () => {
        setPaidFully(true);
        setPaymentAmount(balanceDue > 0 ? String(balanceDue) : '');
        markPaidSheetRef.current?.snapToIndex(0);
    };

    const handlePaidFullyChange = (on) => {
        setPaidFully(on);
        if (on) {
            setPaymentAmount(balanceDue > 0 ? String(balanceDue) : '');
        }
    };

    const handleAmountChange = (value) => {
        setPaymentAmount(value);
        const parsed = Number(String(value).replace(/,/g, '').trim());
        setPaidFully(amountsMatch(parsed, balanceDue));
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

                <Text style={styles.amountHero}>
                    {formatCurrency(paid ? invoice.total : balanceDue, invoice.currency)}
                </Text>
                <Text style={styles.amountHint}>{paid ? 'Total paid' : 'Balance due'}</Text>

                <Text style={styles.section}>Details</Text>
                <View style={styles.group}>
                    <MetaRow label="Issue date" value={format(new Date(invoice.date), 'MMM d, yyyy')} />
                    <MetaRow label="Due date" value={format(new Date(invoice.dueDate), 'MMM d, yyyy')} />
                    <MetaRow label="Total" value={formatCurrency(invoice.total, invoice.currency)} />
                    {amountPaid > 0 || paid ? (
                        <MetaRow
                            label="Amount paid"
                            value={formatCurrency(amountPaid, invoice.currency)}
                        />
                    ) : null}
                    {paid ? (
                        <>
                            <MetaRow
                                label="Paid on"
                                value={invoice.datePaid ? format(new Date(invoice.datePaid), 'MMM d, yyyy') : '—'}
                            />
                            <MetaRow label="Payment" value={getPaymentMethodLabel(invoice.paymentMethod)} />
                            <MetaRow label="Receipt #" value={getReceiptNumber(invoice)} last />
                        </>
                    ) : amountPaid > 0 ? (
                        <MetaRow
                            label="Balance due"
                            value={formatCurrency(balanceDue, invoice.currency)}
                            bold
                            last
                        />
                    ) : (
                        <View style={styles.lastPad} />
                    )}
                </View>

                {paymentHistory.length > 0 ? (
                    <>
                        <Text style={styles.section}>Payment history</Text>
                        <View style={styles.group}>
                            {paymentHistory.map((payment, i, arr) => (
                                <MetaRow
                                    key={`${payment.date || 'p'}-${i}`}
                                    label={
                                        payment.date
                                            ? `${format(new Date(payment.date), 'MMM d, yyyy')} · ${getPaymentMethodLabel(payment.method)}`
                                            : getPaymentMethodLabel(payment.method)
                                    }
                                    value={formatCurrency(payment.amount, invoice.currency)}
                                    last={i === arr.length - 1}
                                />
                            ))}
                        </View>
                    </>
                ) : null}

                <Text style={styles.section}>Line items</Text>
                <View style={styles.group}>
                    {(invoice.items || []).map((item, i, arr) => (
                        <View
                            key={i}
                            style={[styles.lineItem, i < arr.length - 1 && styles.lineBorder]}
                        >
                            <Text style={styles.lineDesc}>{item.description}</Text>
                            <Text style={styles.lineMeta}>
                                {item.quantity} {normalizeInvoiceUnit(item.unit)} ×{' '}
                                {formatCurrency(item.rate, invoice.currency)}
                            </Text>
                            <Text style={styles.lineTotal}>
                                {formatCurrency(item.quantity * item.rate, invoice.currency)}
                            </Text>
                        </View>
                    ))}
                    <MetaRow
                        label="Subtotal"
                        value={formatCurrency(invoice.subtotal, invoice.currency)}
                    />
                    <MetaRow
                        label={`Tax (${invoice.taxRate}%)`}
                        value={formatCurrency(invoice.tax, invoice.currency)}
                    />
                    <MetaRow
                        label="Total"
                        value={formatCurrency(invoice.total, invoice.currency)}
                        bold
                        last
                    />
                </View>

                {invoice.notes ? (
                    <>
                        <Text style={styles.section}>Notes</Text>
                        <Text style={styles.notes}>{invoice.notes}</Text>
                    </>
                ) : null}

                {canEdit || canCancel ? (
                    <View style={styles.dangerZone}>
                        {canCancel ? (
                            <Button
                                title="Cancel invoice"
                                variant="secondary"
                                onPress={() => setConfirmCancel(true)}
                            />
                        ) : null}
                        {canEdit ? (
                            <Button
                                title="Delete invoice"
                                variant="danger"
                                onPress={() => setConfirmDelete(true)}
                                style={{ marginTop: spacing.sm }}
                            />
                        ) : null}
                    </View>
                ) : null}
            </ScrollView>

            <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
                {canMarkPaid ? (
                    <Button title="Record payment" onPress={openPaymentSheet} style={styles.actionBtn} />
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

            <BottomSheet ref={markPaidSheetRef} snapPoints={['72%']}>
                <Text style={styles.sheetTitle}>Record payment</Text>
                <Text style={styles.sheetHint}>
                    Balance due {formatCurrency(balanceDue, invoice.currency)}
                </Text>

                <Text style={styles.fieldLabel}>Amount paid</Text>
                <Input
                    value={paidFully ? String(balanceDue) : paymentAmount}
                    onChangeText={handleAmountChange}
                    keyboardType="decimal-pad"
                    placeholder={String(balanceDue)}
                    editable={!paidFully}
                    style={{ opacity: paidFully ? 0.7 : 1 }}
                />
                <Pressable
                    onPress={() => handlePaidFullyChange(!paidFully)}
                    style={styles.checkboxRow}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: paidFully }}
                    accessibilityLabel="Paid fully"
                >
                    <View style={[styles.checkbox, paidFully && styles.checkboxChecked]}>
                        {paidFully ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>Paid fully</Text>
                </Pressable>
                <Text style={styles.sheetHint}>
                    {Number.isFinite(amountNumber) && amountNumber > 0
                        ? `Balance after this payment: ${formatCurrency(
                              Math.max(0, Math.round((balanceDue - amountNumber) * 100) / 100),
                              invoice.currency
                          )}`
                        : 'Enter the amount paid'}
                </Text>
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Payment method</Text>
                {MARK_PAID_METHODS.map((m) => (
                    <Pressable
                        key={m.value}
                        onPress={() => setPaymentMethod(m.value)}
                        style={[styles.method, paymentMethod === m.value && styles.methodActive]}
                    >
                        <Text style={styles.methodText}>{m.label}</Text>
                    </Pressable>
                ))}
                <Button
                    title={isFullPayment ? 'Record full payment' : 'Record payment'}
                    onPress={handleMarkPaid}
                    loading={saving}
                    style={{ marginTop: spacing.lg }}
                />
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
        flex: 1,
        paddingRight: spacing.sm,
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
        marginBottom: spacing.xs,
    },
    sheetHint: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginBottom: spacing.md,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        alignSelf: 'flex-start',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: colors.slate300,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    checkboxChecked: {
        borderColor: colors.brand,
        backgroundColor: colors.brand,
    },
    checkboxMark: {
        color: '#fff',
        fontSize: 12,
        fontFamily: fontFamily.bold,
        lineHeight: 14,
    },
    checkboxLabel: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.foreground,
    },
    fieldLabel: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.foreground,
        marginBottom: spacing.sm,
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
