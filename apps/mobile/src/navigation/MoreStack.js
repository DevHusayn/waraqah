import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '../screens/MoreScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { UpgradeScreen } from '../screens/UpgradeScreen';
import { MonthlyStatementScreen } from '../screens/MonthlyStatementScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { SettingsStack } from './SettingsStack';
import { QuotationsStack } from './QuotationsStack';
import { getStackScreenOptions } from './headerOptions';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator();

export function MoreStack() {
    const { colors } = useTheme();

    return (
        <Stack.Navigator screenOptions={getStackScreenOptions(colors)}>
            <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsStack} options={{ headerShown: false }} />
            <Stack.Screen name="Quotations" component={QuotationsStack} options={{ headerShown: false }} />
            <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
            <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ title: 'Upgrade' }} />
            <Stack.Screen name="MonthlyStatement" component={MonthlyStatementScreen} options={{ title: 'Statements' }} />
            <Stack.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
        </Stack.Navigator>
    );
}
