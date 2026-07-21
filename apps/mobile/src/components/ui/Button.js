import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { hapticLight } from '../../utils/haptics';
import { colors } from '../../theme';
import { baseStyles } from './styles';

export function Button({
    title,
    onPress,
    variant = 'primary',
    disabled,
    loading,
    style,
    textStyle,
    haptic = true,
    leftIcon,
    rightIcon,
}) {
    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';
    const isDanger = variant === 'danger';
    const isGhost = variant === 'ghost';

    const handlePress = () => {
        if (haptic) hapticLight();
        onPress?.();
    };

    const textColorStyle = isPrimary
        ? baseStyles.buttonTextPrimary
        : isDanger
          ? baseStyles.buttonTextDanger
          : isGhost
            ? baseStyles.buttonTextGhost
            : baseStyles.buttonTextSecondary;

    const spinnerColor = isPrimary || isDanger ? colors.white : colors.brand;

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled || loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || loading, busy: !!loading }}
            style={({ pressed }) => [
                baseStyles.button,
                isPrimary && baseStyles.buttonPrimary,
                isSecondary && baseStyles.buttonSecondary,
                isDanger && baseStyles.buttonDanger,
                isGhost && baseStyles.buttonGhost,
                (disabled || loading) && baseStyles.buttonDisabled,
                pressed && !disabled && !loading && baseStyles.buttonPressed,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={spinnerColor} />
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {leftIcon}
                    <Text style={[baseStyles.buttonText, textColorStyle, textStyle]}>{title}</Text>
                    {rightIcon}
                </View>
            )}
        </Pressable>
    );
}
