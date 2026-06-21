import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InvoicesListScreen } from '../screens/InvoicesListScreen';
import { InvoiceDetailScreen } from '../screens/InvoiceDetailScreen';
import { CreateInvoiceScreen } from '../screens/CreateInvoiceScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export function InvoicesStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.brand,
                headerTitleStyle: { fontWeight: '700' },
            }}
        >
            <Stack.Screen name="InvoicesList" component={InvoicesListScreen} options={{ title: 'Invoices' }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Invoice' }} />
            <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} options={{ title: 'Invoice' }} />
        </Stack.Navigator>
    );
}
