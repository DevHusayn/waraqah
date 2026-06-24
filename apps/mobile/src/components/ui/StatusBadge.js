import { Text, View } from 'react-native';
import { colors } from '../../theme';
import { baseStyles } from './styles';

export function StatusBadge({ status }) {
    const map = {
        pending: { bg: '#fef3c7', text: '#92400e' },
        paid: { bg: '#d1fae5', text: '#065f46' },
        overdue: { bg: '#fee2e2', text: '#991b1b' },
        cancelled: { bg: colors.slate100, text: colors.slate600 },
        draft: { bg: colors.slate100, text: colors.slate600 },
    };
    const c = map[status] || map.pending;
    return (
        <View style={[baseStyles.badge, { backgroundColor: c.bg }]}>
            <Text style={[baseStyles.badgeText, { color: c.text }]}>
                {(status || 'pending').toUpperCase()}
            </Text>
        </View>
    );
}
