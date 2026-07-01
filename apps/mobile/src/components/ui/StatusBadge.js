import { Text, View } from 'react-native';
import { colors } from '../../theme';
import { baseStyles } from './styles';

export function StatusBadge({ status }) {
    const map = {
        pending: { bg: '#FEF3C7', text: '#92400E' },
        paid: { bg: colors.brandLight, text: colors.brandDark },
        overdue: { bg: '#FEE2E2', text: '#991B1B' },
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
