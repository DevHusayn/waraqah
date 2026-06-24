import { ScrollView, View } from 'react-native';
import { baseStyles } from './styles';

export function Screen({ children, scroll = false, style, contentStyle }) {
    if (scroll) {
        return (
            <ScrollView
                style={[baseStyles.screen, style]}
                contentContainerStyle={[baseStyles.scrollContent, contentStyle]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>
        );
    }
    return <View style={[baseStyles.screen, style]}>{children}</View>;
}
