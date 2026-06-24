import { Text } from 'react-native';
import { Card } from './Card';
import { baseStyles } from './styles';

export function EmptyState({ title, message, action, icon: Icon }) {
    return (
        <Card style={baseStyles.empty} elevated>
            {Icon ? <Icon size={40} color="#94a3b8" style={{ marginBottom: 12 }} /> : null}
            <Text style={baseStyles.emptyTitle}>{title}</Text>
            <Text style={baseStyles.emptyMessage}>{message}</Text>
            {action}
        </Card>
    );
}
