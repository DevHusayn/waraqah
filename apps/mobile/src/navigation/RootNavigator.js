import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { setUnauthorizedHandler } from '../api/client';
import { useAppStore } from '../stores/appStore';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CheckEmailScreen } from '../screens/CheckEmailScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { MainTabs } from './MainTabs';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

const linking = {
    prefixes: [Linking.createURL('/'), 'waraqah://'],
    config: {
        screens: {
            Auth: {
                screens: {
                    ResetPassword: 'reset-password/:token',
                    Welcome: 'welcome',
                    Login: 'login',
                    Register: 'register',
                },
            },
            Main: {
                screens: {
                    Dashboard: 'home',
                    Invoices: 'invoices',
                    Clients: 'clients',
                    More: {
                        path: 'more',
                        screens: {
                            Upgrade: 'upgrade/callback',
                        },
                    },
                },
            },
        },
    },
};

function AuthStack() {
    const onboardingComplete = useAppStore((s) => s.onboardingComplete);

    return (
        <Stack.Navigator
            initialRouteName={onboardingComplete ? 'Welcome' : 'Onboarding'}
            screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}
        >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
            <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
                options={{ headerShown: true, title: 'Reset password', headerTintColor: colors.brand }}
            />
        </Stack.Navigator>
    );
}

export function RootNavigator() {
    const { isAuthenticated, booting, logout } = useAuth();
    const hydrate = useAppStore((s) => s.hydrate);
    const hydrated = useAppStore((s) => s.hydrated);
    const [splashDone, setSplashDone] = useState(false);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        setUnauthorizedHandler(() => logout());
    }, [logout]);

    if (!splashDone || booting || !hydrated) {
        return (
            <View style={{ flex: 1 }}>
                <SplashScreen onFinish={() => setSplashDone(true)} />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
                {isAuthenticated ? (
                    <Stack.Screen name="Main" component={MainTabs} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
