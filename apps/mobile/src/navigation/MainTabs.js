import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, FileText, Users, Menu } from 'lucide-react-native';
import { useInvoice } from '../context/InvoiceContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientsScreen } from '../screens/ClientsScreen';
import { InvoicesStack } from './InvoicesStack';
import { MoreStack } from './MoreStack';
import { CustomTabBar } from './CustomTabBar';

const Tab = createBottomTabNavigator();

export function MainTabs() {
    const { draftCount } = useInvoice();
    const draftBadge = draftCount > 0 ? draftCount : undefined;

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2} />,
                    tabBarAccessibilityLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Invoices"
                component={InvoicesStack}
                options={{
                    title: 'Invoices',
                    tabBarIcon: ({ color, size }) => <FileText color={color} size={size} strokeWidth={2} />,
                    tabBarBadge: draftBadge,
                    tabBarAccessibilityLabel: 'Invoices',
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsScreen}
                options={{
                    title: 'Clients',
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2} />,
                    tabBarAccessibilityLabel: 'Clients',
                }}
            />
            <Tab.Screen
                name="More"
                component={MoreStack}
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }) => <Menu color={color} size={size} strokeWidth={2} />,
                    tabBarAccessibilityLabel: 'More',
                }}
            />
        </Tab.Navigator>
    );
}
