import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useShakeAnimation(trigger) {
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!trigger) return undefined;

        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        return undefined;
    }, [trigger, shakeAnim]);

    return shakeAnim;
}
