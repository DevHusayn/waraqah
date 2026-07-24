import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QuotationsListScreen } from '../screens/QuotationsListScreen';
import { QuotationDetailScreen } from '../screens/QuotationDetailScreen';
import { CreateQuotationScreen } from '../screens/CreateQuotationScreen';
import { stackScreenOptions } from './headerOptions';

const Stack = createNativeStackNavigator();

export function QuotationsStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen
                name="QuotationsList"
                component={QuotationsListScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="QuotationDetail"
                component={QuotationDetailScreen}
                options={{ title: 'Quotation' }}
            />
            <Stack.Screen
                name="CreateQuotation"
                component={CreateQuotationScreen}
                options={({ route }) => ({
                    title: route.params?.id ? 'Edit quotation' : 'New quotation',
                })}
            />
        </Stack.Navigator>
    );
}
