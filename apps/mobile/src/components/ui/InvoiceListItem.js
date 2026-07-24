import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, ChevronRight, Clock, XCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { formatCurrency, getDisplayNumber, isQuotationDocument } from '@waraqah/shared';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../../theme';
import { hapticSelection } from '../../utils/haptics';

const STATUS_META = {
    paid: { label: 'Paid', bg: colors.brandLight, color: colors.brand, Icon: CheckCircle2 },
    pending: { label: 'Pending', bg: '#FFEDD5', color: '#EA580C', Icon: Clock },
    overdue: { label: 'Overdue', bg: '#FEE2E2', color: colors.red600, Icon: Clock },
    draft: { label: 'Draft', bg: colors.slate100, color: colors.slate500, Icon: Clock },
    cancelled: { label: 'Cancelled', bg: colors.slate100, color: colors.slate500, Icon: Clock },
    sent: { label: 'Sent', bg: '#E0F2FE', color: '#0284C7', Icon: Clock },
    accepted: { label: 'Accepted', bg: colors.brandLight, color: colors.brand, Icon: CheckCircle2 },
    rejected: { label: 'Rejected', bg: '#FEE2E2', color: colors.red600, Icon: XCircle },
    expired: { label: 'Expired', bg: '#FFEDD5', color: '#EA580C', Icon: Clock },
    converted: { label: 'Converted', bg: colors.violet50, color: colors.violet600, Icon: CheckCircle2 },
};

/**
 * Mockup-style invoice/quotation row: status icon column + details + amount + chevron
 */
export function InvoiceListItem({ invoice, clientName, onPress, last = false, showTypeBadge = false }) {
    const status = STATUS_META[invoice.status] || STATUS_META.pending;
    const { Icon } = status;
    const client = clientName || invoice.clientName || invoice.client?.name || 'No client';
    const dateLabel = invoice.date ? format(new Date(invoice.date), 'MMM d, yyyy') : '';
    const isQuotation =
        showTypeBadge &&
        (isQuotationDocument(invoice) || invoice.documentType === 'quotation');

    return (
        <Pressable
            onPress={() => {
                hapticSelection();
                onPress?.();
            }}
            style={({ pressed }) => [styles.row, !last && styles.border, pressed && styles.pressed]}
            accessibilityRole="button"
        >
            <View style={styles.statusCol}>
                <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                    <Icon size={16} color={status.color} strokeWidth={2.25} />
                </View>
                <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
            </View>

            <View style={styles.body}>
                <View style={styles.numberRow}>
                    <Text style={styles.number} numberOfLines={1}>
                        {getDisplayNumber(invoice)}
                    </Text>
                    {showTypeBadge ? (
                        <View style={[styles.typeBadge, isQuotation ? styles.typeQtn : styles.typeInv]}>
                            <Text style={[styles.typeBadgeText, isQuotation ? styles.typeQtnText : styles.typeInvText]}>
                                {isQuotation ? 'QTN' : 'INV'}
                            </Text>
                        </View>
                    ) : null}
                </View>
                <Text style={styles.client} numberOfLines={1}>
                    {client}
                </Text>
                {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
            </View>

            <View style={styles.right}>
                <Text style={styles.amount}>{formatCurrency(invoice.total || 0, invoice.currency)}</Text>
                <ChevronRight size={18} color={colors.slate300} strokeWidth={2} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
    },
    border: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderLight,
    },
    pressed: {
        backgroundColor: colors.surfaceMuted,
    },
    statusCol: {
        width: 52,
        alignItems: 'center',
        gap: 4,
    },
    statusIcon: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusLabel: {
        fontFamily: fontFamily.medium,
        fontSize: 10,
    },
    body: {
        flex: 1,
        minWidth: 0,
    },
    numberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
    },
    number: {
        flexShrink: 1,
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.md,
        color: colors.foreground,
        letterSpacing: -0.2,
    },
    typeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeInv: { backgroundColor: colors.brandLight },
    typeQtn: { backgroundColor: '#E0F2FE' },
    typeBadgeText: {
        fontFamily: fontFamily.semibold,
        fontSize: 9,
        letterSpacing: 0.3,
    },
    typeInvText: { color: colors.brand },
    typeQtnText: { color: '#0284C7' },
    client: {
        marginTop: 2,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
    },
    date: {
        marginTop: 2,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.slate400,
        lineHeight: lineHeight.xs,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    amount: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.foreground,
        letterSpacing: -0.2,
    },
});
