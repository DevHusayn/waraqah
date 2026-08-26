import { View } from 'react-native';
import { shadows } from '../../theme';
import { useBaseStyles } from './styles';

/**
 * Use sparingly — prefer open layouts and separators for lists.
 * Cards are for grouped interactive content only.
 */
export function Card({ children, style, elevated = false }) {
    const baseStyles = useBaseStyles();

    return (
        <View style={[baseStyles.card, elevated ? shadows.soft : null, style]}>
            {children}
        </View>
    );
}
