import { View } from 'react-native';
import { shadows } from '../../theme';
import { baseStyles } from './styles';

export function Card({ children, style, elevated = false }) {
    return (
        <View style={[baseStyles.card, elevated && shadows.card, style]}>
            {children}
        </View>
    );
}
