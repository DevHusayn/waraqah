import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InvoicesListScreen } from '../screens/InvoicesListScreen';
import { InvoiceDetailScreen } from '../screens/InvoiceDetailScreen';
import { CreateInvoiceScreen } from '../screens/CreateInvoiceScreen';
import { DraftsScreen } from '../screens/DraftsScreen';
import { getStackScreenOptions } from './headerOptions';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator();

export function InvoicesStack() {
    const { colors } = useTheme();

    return (
        <Stack.Navigator screenOptions={getStackScreenOptions(colors)}>
            <Stack.Screen
                name="InvoicesList"
                component={InvoicesListScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen name="Drafts" component={DraftsScreen} options={{ title: 'Drafts' }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice' }} />
            <Stack.Screen
                name="CreateInvoice"
                component={CreateInvoiceScreen}
                options={({ route }) => ({
                    title: route.params?.id ? 'Edit invoice' : 'New invoice',
                })}
            />
        </Stack.Navigator>
    );
}
