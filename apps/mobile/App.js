import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { InvoiceProvider } from './src/context/InvoiceContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ToastProvider } from './src/context/ToastContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <SettingsProvider>
                    <InvoiceProvider>
                        <ToastProvider>
                            <RootNavigator />
                            <StatusBar style="dark" />
                        </ToastProvider>
                    </InvoiceProvider>
                </SettingsProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
