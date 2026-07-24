import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../../theme';

export function StatusBadge({ status }) {
    const map = {
        pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
        partial: { bg: '#E0F2FE', text: '#075985', label: 'Partial' },
        paid: { bg: colors.brandLight, text: colors.brandDark, label: 'Paid' },
        overdue: { bg: '#FEE2E2', text: '#991B1B', label: 'Overdue' },
        cancelled: { bg: colors.slate100, text: colors.slate600, label: 'Cancelled' },
        draft: { bg: colors.slate100, text: colors.slate600, label: 'Draft' },
        sent: { bg: '#E0F2FE', text: '#075985', label: 'Sent' },
        accepted: { bg: colors.brandLight, text: colors.brandDark, label: 'Accepted' },
        rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
        expired: { bg: '#FFEDD5', text: '#9A3412', label: 'Expired' },
        converted: { bg: colors.violet50, text: colors.violet600, label: 'Converted' },
    };
    const c = map[status] || map.pending;
    return (
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    text: {
        fontFamily: fontFamily.semibold,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
});
