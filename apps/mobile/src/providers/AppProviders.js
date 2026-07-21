import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { InvoiceProvider } from '../context/InvoiceContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ToastProvider } from '../context/ToastContext';
import { useAppStore } from '../stores/appStore';
import { OfflineBanner } from '../components/OfflineBanner';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function NetworkWatcher({ children }) {
    const setOffline = useAppStore((s) => s.setOffline);

    useEffect(() => {
        const unsub = NetInfo.addEventListener((state) => {
            const offline = !(state.isConnected && state.isInternetReachable !== false);
            setOffline(offline);
        });
        return unsub;
    }, [setOffline]);

    return children;
}

export function AppProviders({ children }) {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <BottomSheetModalProvider>
                        <AuthProvider>
                            <SettingsProvider>
                                <InvoiceProvider>
                                    <ToastProvider>
                                        <NetworkWatcher>
                                            {children}
                                            <OfflineBanner />
                                        </NetworkWatcher>
                                    </ToastProvider>
                                </InvoiceProvider>
                            </SettingsProvider>
                        </AuthProvider>
                    </BottomSheetModalProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

export { queryClient };
