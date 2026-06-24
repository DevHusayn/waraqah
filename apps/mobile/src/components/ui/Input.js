import { TextInput } from 'react-native';
import { colors } from '../../theme';
import { baseStyles } from './styles';

export function Input({ error, style, ...props }) {
    return (
        <TextInput
            placeholderTextColor={colors.slate400}
            style={[baseStyles.input, error && baseStyles.inputError, style]}
            {...props}
        />
    );
}
