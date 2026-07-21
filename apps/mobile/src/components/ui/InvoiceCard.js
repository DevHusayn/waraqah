import { StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react-native';
import { formatCurrency, getDisplayNumber } from '@waraqah/shared';
import { ListRow } from './ListRow';
import { StatusBadge } from './StatusBadge';
import { colors, fontFamily, fontSize } from '../../theme';

export function InvoiceCard({ invoice, onPress, onLongPress, last = false, clientName }) {
    const client = clientName || invoice.clientName || invoice.client?.name || 'No client';
    const dateLabel = invoice.date ? format(new Date(invoice.date), 'MMM d') : '';
    const amount = formatCurrency(invoice.total || 0, invoice.currency);

    return (
        <ListRow
            title={getDisplayNumber(invoice)}
            subtitle={client}
            meta={dateLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            showChevron={false}
            last={last}
            badge={<StatusBadge status={invoice.status} />}
            right={
                <View style={styles.right}>
                    <Text style={styles.amount}>{amount}</Text>
                    <ChevronRight size={16} color={colors.slate300} strokeWidth={2} />
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    amount: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.foreground,
        letterSpacing: -0.2,
    },
});
