import { Text } from 'react-native';
import { useBaseStyles } from './styles';

export function Title({ children, style }) {
    const baseStyles = useBaseStyles();
    return <Text style={[baseStyles.title, style]}>{children}</Text>;
}

export function Subtitle({ children, style }) {
    const baseStyles = useBaseStyles();
    return <Text style={[baseStyles.subtitle, style]}>{children}</Text>;
}

export function Label({ children, required }) {
    const baseStyles = useBaseStyles();
    return (
        <Text style={baseStyles.label}>
            {children}
            {required ? <Text style={baseStyles.required}> *</Text> : null}
        </Text>
    );
}

export function FieldError({ message }) {
    const baseStyles = useBaseStyles();
    if (!message) return null;
    return <Text style={baseStyles.fieldError}>{message}</Text>;
}
