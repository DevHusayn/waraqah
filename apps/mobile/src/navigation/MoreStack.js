import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '../screens/MoreScreen';
import { UpgradeScreen } from '../screens/UpgradeScreen';
import { MonthlyStatementScreen } from '../screens/MonthlyStatementScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { SettingsStack } from './SettingsStack';
import { stackScreenOptions } from './headerOptions';

const Stack = createNativeStackNavigator();

export function MoreStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'More', headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsStack} options={{ headerShown: false }} />
            <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
            <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ title: 'Upgrade' }} />
            <Stack.Screen name="MonthlyStatement" component={MonthlyStatementScreen} options={{ title: 'Statements' }} />
            <Stack.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
        </Stack.Navigator>
    );
}
