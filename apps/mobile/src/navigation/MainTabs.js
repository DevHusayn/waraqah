import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, FileText, Users, Menu } from 'lucide-react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { InvoicesStack } from './InvoicesStack';
import { MoreStack } from './MoreStack';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.slate400,
                tabBarStyle: { borderTopColor: colors.slate200 },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
                    headerShown: true,
                    headerStyle: { backgroundColor: colors.white },
                    headerTintColor: colors.slate900,
                }}
            />
            <Tab.Screen
                name="Invoices"
                component={InvoicesStack}
                options={{
                    tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                    headerShown: true,
                    headerStyle: { backgroundColor: colors.white },
                    headerTitle: 'Clients',
                }}
            />
            <Tab.Screen
                name="More"
                component={MoreStack}
                options={{
                    tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}
