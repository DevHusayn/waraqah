import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import {
    formatCurrency,
    getDisplayNumber,
    normalizeInvoiceUnit,
} from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { useQuotation } from '../context/QuotationContext';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { Button, PageLoader, StatusBadge } from '../components/ui';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '../theme';

function quotationHasLineItems(quotation) {
    return Boolean(quotation && Array.isArray(quotation.items) && quotation.items.length > 0);
}

export function QuotationDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const insets = useSafeAreaInsets();
    const {
        quotations,
        deleteQuotation,
        updateQuotation,
        convertQuotation,
        sendQuotationEmailToClient,
        upsertQuotation,
        loading,
    } = useQuotation();
    const { clients, upsertInvoice } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const [pdfLoading, setPdfLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmConvert, setConfirmConvert] = useState(false);
    const [converting, setConverting] = useState(false);
    const [emailing, setEmailing] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [fetchedQuotation, setFetchedQuotation] = useState(null);
    const [resolving, setResolving] = useState(false);

    const quotationFromList = useMemo(
        () => quotations.find((q) => String(q.id) === String(id)),
        [quotations, id]
    );

    const quotation = useMemo(() => {
        if (quotationHasLineItems(quotationFromList)) return quotationFromList;
        if (quotationHasLineItems(fetchedQuotation)) return fetchedQuotation;
        return fetchedQuotation || quotationFromList || null;
    }, [quotationFromList, fetchedQuotation]);

    const client = useMemo(
        () => clients.find((c) => c.id === quotation?.clientId),
        [clients, quotation]
    );

    useEffect(() => {
        if (!id) return undefined;
        if (quotationHasLineItems(quotationFromList)) {
            setFetchedQuotation(null);
            setResolving(false);
            return undefined;
        }
        if (loading) return undefined;

        let cancelled = false;
        setResolving(true);
        apiFetch(`/quotations/${id}`)
            .then((data) => {
                if (!cancelled) {
                    const mapped = { ...data, id: data._id || data.id };
                    setFetchedQuotation(mapped);
                    upsertQuotation(mapped);
                }
            })
            .catch(() => {
                if (!cancelled) navigation.goBack();
            })
            .finally(() => {
                if (!cancelled) setResolving(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, loading, quotationFromList, navigation, upsertQuotation]);

    const status = quotation?.status || 'draft';
    const canEdit = quotation && !['converted', 'expired'].includes(status);
    const canDelete = quotation && status !== 'converted';
    const canConvert = quotation && ['sent', 'accepted'].includes(status);
    const canAccept = quotation && status === 'sent';
    const canReject = quotation && status === 'sent';
    const canUndo = quotation && ['accepted', 'rejected'].includes(status);
    const canEmailClient = quotation && status !== 'draft' && Boolean(client?.email?.trim());

    if (loading || resolving || !quotation || !quotationHasLineItems(quotation)) {
        return <PageLoader />;
    }

    const handleShare = async () => {
        if (!client) {
            showToast('Client not found', 'error');
            return;
        }
        setPdfLoading(true);
        try {
            const { shareQuotationPdf } = await import('../pdf/sharePdf');
            await shareQuotationPdf(quotation, client, businessInfo);
            showToast('Quotation ready to share', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to generate PDF', 'error');
        } finally {
            setPdfLoading(false);
        }
    };

    const handleEmail = async () => {
        setEmailing(true);
        try {
            const result = await sendQuotationEmailToClient(id);
            showToast(
                result?.sentTo ? `Quotation emailed to ${result.sentTo}` : 'Quotation emailed',
                'success'
            );
        } catch (err) {
            showToast(err.message || 'Failed to send email', 'error');
        } finally {
            setEmailing(false);
        }
    };

    const handleConvert = async () => {
        setConverting(true);
        try {
            const { invoice } = await convertQuotation(id);
            if (upsertInvoice) upsertInvoice(invoice);
            setConfirmConvert(false);
            showToast('Quotation converted to invoice', 'success');
            const tabNav = navigation.getParent()?.getParent() || navigation.getParent() || navigation;
            tabNav.navigate('Invoices', {
                screen: 'InvoiceDetail',
                params: { id: invoice.id },
            });
        } catch (err) {
            showToast(err.message || 'Failed to convert quotation', 'error');
        } finally {
            setConverting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteQuotation(id);
            setConfirmDelete(false);
            showToast('Quotation deleted', 'success');
            navigation.goBack();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleStatusChange = async (nextStatus) => {
        setStatusUpdating(true);
        try {
            const updated = await updateQuotation(id, { status: nextStatus });
            setFetchedQuotation(updated);
            const messages = {
                accepted: 'Marked as accepted',
                rejected: 'Marked as rejected',
                sent: 'Status restored to sent',
            };
            showToast(messages[nextStatus] || 'Status updated', 'success');
        } catch (err) {
            showToast(err.message || 'Failed to update status', 'error');
        } finally {
            setStatusUpdating(false);
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
                        <Text style={styles.number}>{getDisplayNumber(quotation)}</Text>
                        <Text style={styles.client}>{client?.name || 'No client'}</Text>
                    </View>
                    <StatusBadge status={quotation.status} />
                </View>

                <Text style={styles.amountHero}>
                    {formatCurrency(quotation.total, quotation.currency)}
                </Text>
                <Text style={styles.amountHint}>Estimated total</Text>

                <Text style={styles.section}>Details</Text>
                <View style={styles.group}>
                    <MetaRow
                        label="Issue date"
                        value={
                            quotation.date
                                ? format(new Date(quotation.date), 'MMM d, yyyy')
                                : '—'
                        }
                    />
                    <MetaRow
                        label="Valid until"
                        value={
                            quotation.validUntil
                                ? format(new Date(quotation.validUntil), 'MMM d, yyyy')
                                : '—'
                        }
                        last={!quotation.convertedInvoiceId}
                    />
                    {quotation.convertedInvoiceId ? (
                        <MetaRow
                            label="Invoice"
                            value="Converted"
                            last
                        />
                    ) : null}
                </View>

                <Text style={styles.section}>Line items</Text>
                <View style={styles.group}>
                    {(quotation.items || []).map((item, i, arr) => (
                        <View
                            key={i}
                            style={[styles.lineItem, i < arr.length - 1 && styles.lineBorder]}
                        >
                            <Text style={styles.lineDesc}>{item.description}</Text>
                            <Text style={styles.lineMeta}>
                                {item.quantity} {normalizeInvoiceUnit(item.unit)} ×{' '}
                                {formatCurrency(item.rate, quotation.currency)}
                            </Text>
                            <Text style={styles.lineTotal}>
                                {formatCurrency(item.quantity * item.rate, quotation.currency)}
                            </Text>
                        </View>
                    ))}
                    <MetaRow
                        label="Subtotal"
                        value={formatCurrency(quotation.subtotal, quotation.currency)}
                    />
                    <MetaRow
                        label={`Tax (${quotation.taxRate}%)`}
                        value={formatCurrency(quotation.tax, quotation.currency)}
                    />
                    <MetaRow
                        label="Estimated total"
                        value={formatCurrency(quotation.total, quotation.currency)}
                        bold
                        last
                    />
                </View>

                {quotation.notes ? (
                    <>
                        <Text style={styles.section}>Notes</Text>
                        <Text style={styles.notes}>{quotation.notes}</Text>
                    </>
                ) : null}

                {quotation.terms ? (
                    <>
                        <Text style={styles.section}>Terms & conditions</Text>
                        <Text style={styles.notes}>{quotation.terms}</Text>
                    </>
                ) : null}

                {canDelete ? (
                    <View style={styles.dangerZone}>
                        <Button
                            title="Delete quotation"
                            variant="danger"
                            onPress={() => setConfirmDelete(true)}
                        />
                    </View>
                ) : null}
            </ScrollView>

            <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
                {canConvert ? (
                    <Button
                        title="Convert to invoice"
                        onPress={() => setConfirmConvert(true)}
                        loading={converting}
                        style={styles.actionBtn}
                    />
                ) : null}
                <Button
                    title="Share"
                    variant="secondary"
                    onPress={handleShare}
                    loading={pdfLoading}
                    style={styles.actionBtn}
                />
                {canEmailClient ? (
                    <Button
                        title="Email"
                        variant="secondary"
                        onPress={handleEmail}
                        loading={emailing}
                        style={styles.actionBtn}
                    />
                ) : null}
                {canAccept ? (
                    <Button
                        title="Accept"
                        variant="secondary"
                        onPress={() => handleStatusChange('accepted')}
                        loading={statusUpdating}
                        style={styles.actionBtn}
                    />
                ) : null}
                {canReject ? (
                    <Button
                        title="Reject"
                        variant="secondary"
                        onPress={() => handleStatusChange('rejected')}
                        loading={statusUpdating}
                        style={styles.actionBtn}
                    />
                ) : null}
                {canUndo ? (
                    <Button
                        title="Undo status"
                        variant="secondary"
                        onPress={() => handleStatusChange('sent')}
                        loading={statusUpdating}
                        style={styles.actionBtn}
                    />
                ) : null}
                {canEdit ? (
                    <Button
                        title="Edit"
                        variant="secondary"
                        onPress={() => navigation.navigate('CreateQuotation', { id })}
                        style={styles.actionBtn}
                    />
                ) : null}
            </View>

            <ConfirmModal
                visible={confirmDelete}
                title="Delete quotation?"
                message="This cannot be undone."
                confirmLabel="Delete"
                danger
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
            <ConfirmModal
                visible={confirmConvert}
                title="Convert to invoice?"
                message="This will create a new invoice from this quotation."
                confirmLabel="Convert"
                loading={converting}
                onConfirm={handleConvert}
                onCancel={() => setConfirmConvert(false)}
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
});
