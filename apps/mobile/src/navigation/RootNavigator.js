import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { setUnauthorizedHandler } from '../api/client';
import { AuthScreen } from '../screens/AuthScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { MainTabs } from './MainTabs';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

const linking = {
    prefixes: [Linking.createURL('/'), 'waraqah://'],
    config: {
        screens: {
            ResetPassword: 'reset-password/:token',
            Main: {
                screens: {
                    More: {
                        screens: {
                            Upgrade: 'upgrade/callback',
                        },
                    },
                },
            },
        },
    },
};

export function RootNavigator() {
    const { isAuthenticated, booting, logout } = useAuth();

    useEffect(() => {
        setUnauthorizedHandler(() => logout());
    }, [logout]);

    if (booting) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate50 }}>
                <ActivityIndicator size="large" color={colors.brand} />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <Stack.Screen name="Main" component={MainTabs} />
                ) : (
                    <>
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen
                            name="ResetPassword"
                            component={ResetPasswordScreen}
                            options={{ headerShown: true, title: 'Reset password', headerTintColor: colors.brand }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
