import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QuotationsListScreen } from '../screens/QuotationsListScreen';
import { QuotationDetailScreen } from '../screens/QuotationDetailScreen';
import { CreateQuotationScreen } from '../screens/CreateQuotationScreen';
import { getStackScreenOptions } from './headerOptions';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator();

export function QuotationsStack() {
    const { colors } = useTheme();

    return (
        <Stack.Navigator screenOptions={getStackScreenOptions(colors)}>
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
