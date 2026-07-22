import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_700Bold_Italic,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AppProviders } from './src/providers/AppProviders';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Spinner } from './src/components/Spinner';
import { colors } from './src/theme/colors';

export default function App() {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_700Bold_Italic,
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.brandSubtle, alignItems: 'center', justifyContent: 'center' }}>
                <Spinner />
            </View>
        );
    }

    return (
        <AppProviders>
            <RootNavigator />
            <StatusBar style="dark" />
        </AppProviders>
    );
}
