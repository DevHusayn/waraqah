import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '../screens/MoreScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { UpgradeScreen } from '../screens/UpgradeScreen';
import { MonthlyStatementScreen } from '../screens/MonthlyStatementScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export function MoreStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.brand,
                headerTitleStyle: { fontWeight: '700' },
            }}
        >
            <Stack.Screen name="MoreMenu" component={MoreScreen} options={{ title: 'More' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
            <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ title: 'Upgrade' }} />
            <Stack.Screen name="MonthlyStatement" component={MonthlyStatementScreen} options={{ title: 'Statements' }} />
            <Stack.Screen name="Admin" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
        </Stack.Navigator>
    );
}
