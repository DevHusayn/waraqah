import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsIndexScreen } from '../screens/settings/SettingsIndexScreen';
import { CompanyProfileSettingsScreen } from '../screens/settings/CompanyProfileSettingsScreen';
import { AccountDetailsSettingsScreen } from '../screens/settings/AccountDetailsSettingsScreen';
import { BrandingSettingsScreen } from '../screens/settings/BrandingSettingsScreen';
import { PlanBillingSettingsScreen } from '../screens/settings/PlanBillingSettingsScreen';
import { AboutSettingsScreen } from '../screens/settings/AboutSettingsScreen';
import { TermsSettingsScreen } from '../screens/settings/TermsSettingsScreen';
import { stackScreenOptions } from './headerOptions';

const Stack = createNativeStackNavigator();

export function SettingsStack() {
    return (
        <Stack.Navigator screenOptions={stackScreenOptions}>
            <Stack.Screen name="SettingsIndex" component={SettingsIndexScreen} options={{ title: 'Settings' }} />
            <Stack.Screen name="CompanyProfile" component={CompanyProfileSettingsScreen} options={{ title: 'Company profile' }} />
            <Stack.Screen name="AccountDetails" component={AccountDetailsSettingsScreen} options={{ title: 'Account details' }} />
            <Stack.Screen name="Branding" component={BrandingSettingsScreen} options={{ title: 'Branding' }} />
            <Stack.Screen name="PlanBilling" component={PlanBillingSettingsScreen} options={{ title: 'Plan & billing' }} />
            <Stack.Screen name="About" component={AboutSettingsScreen} options={{ title: 'About' }} />
            <Stack.Screen name="Terms" component={TermsSettingsScreen} options={{ title: 'Terms' }} />
        </Stack.Navigator>
    );
}
