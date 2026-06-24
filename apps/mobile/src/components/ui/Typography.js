import { Text } from 'react-native';
import { baseStyles } from './styles';

export function Title({ children, style }) {
    return <Text style={[baseStyles.title, style]}>{children}</Text>;
}

export function Subtitle({ children, style }) {
    return <Text style={[baseStyles.subtitle, style]}>{children}</Text>;
}

export function Label({ children, required }) {
    return (
        <Text style={baseStyles.label}>
            {children}
            {required ? <Text style={baseStyles.required}> *</Text> : null}
        </Text>
    );
}

export function FieldError({ message }) {
    if (!message) return null;
    return <Text style={baseStyles.fieldError}>{message}</Text>;
}
