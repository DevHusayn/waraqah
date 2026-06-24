import { Pressable, Text } from 'react-native';
import { hapticLight } from '../../utils/haptics';
import { baseStyles } from './styles';

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, haptic = true }) {
    const isPrimary = variant === 'primary';
    const isDanger = variant === 'danger';

    const handlePress = () => {
        if (haptic) hapticLight();
        onPress?.();
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                baseStyles.button,
                isPrimary && baseStyles.buttonPrimary,
                variant === 'secondary' && baseStyles.buttonSecondary,
                isDanger && baseStyles.buttonDanger,
                (disabled || loading) && baseStyles.buttonDisabled,
                pressed && baseStyles.buttonPressed,
                style,
            ]}
        >
            <Text
                style={[
                    baseStyles.buttonText,
                    isPrimary && baseStyles.buttonTextPrimary,
                    variant === 'secondary' && baseStyles.buttonTextSecondary,
                    isDanger && baseStyles.buttonTextDanger,
                ]}
            >
                {loading ? 'Please wait…' : title}
            </Text>
        </Pressable>
    );
}
