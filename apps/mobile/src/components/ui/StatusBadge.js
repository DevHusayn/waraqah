import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../../theme';

export function StatusBadge({ status }) {
    const map = {
        pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
        paid: { bg: colors.brandLight, text: colors.brandDark, label: 'Paid' },
        overdue: { bg: '#FEE2E2', text: '#991B1B', label: 'Overdue' },
        cancelled: { bg: colors.slate100, text: colors.slate600, label: 'Cancelled' },
        draft: { bg: colors.slate100, text: colors.slate600, label: 'Draft' },
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
