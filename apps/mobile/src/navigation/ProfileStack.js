import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { UpgradeScreen } from '../screens/UpgradeScreen';
import { MonthlyStatementScreen } from '../screens/MonthlyStatementScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { SettingsStack } from './SettingsStack';
import { stackScreenOptions } from './headerOptions';

const Stack = createNativeStackNavigator();

export function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsStack} options={{ headerShown: false }} />
            <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ title: 'Upgrade' }} />
            <Stack.Screen name="MonthlyStatement" component={MonthlyStatementScreen} options={{ title: 'Statements' }} />
            <Stack.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
        </Stack.Navigator>
    );
}
