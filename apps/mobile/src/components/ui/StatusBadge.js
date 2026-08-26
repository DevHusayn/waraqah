import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, useTheme } from '../../theme';

function getStatusMap(colors, isDark) {
    if (isDark) {
        return {
            pending: { bg: colors.amber50, text: colors.amber600, label: 'Pending' },
            partial: { bg: '#082F49', text: '#7DD3FC', label: 'Partial' },
            paid: { bg: colors.brandLight, text: colors.green600, label: 'Paid' },
            overdue: { bg: colors.red50, text: colors.red600, label: 'Overdue' },
            cancelled: { bg: colors.slate100, text: colors.slate600, label: 'Cancelled' },
            draft: { bg: colors.slate100, text: colors.slate600, label: 'Draft' },
            sent: { bg: '#082F49', text: '#7DD3FC', label: 'Sent' },
            accepted: { bg: colors.brandLight, text: colors.green600, label: 'Accepted' },
            rejected: { bg: colors.red50, text: colors.red600, label: 'Rejected' },
            expired: { bg: '#431407', text: '#FDBA74', label: 'Expired' },
            converted: { bg: colors.violet50, text: colors.violet600, label: 'Converted' },
        };
    }

    return {
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
}

export function StatusBadge({ status }) {
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const map = useMemo(() => getStatusMap(colors, isDark), [colors, isDark]);
    const c = map[status] || map.pending;
    return (
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
            <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
        </View>
    );
}

function createStyles() {
    return StyleSheet.create({
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
}
