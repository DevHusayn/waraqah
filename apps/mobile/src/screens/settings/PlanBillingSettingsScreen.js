import { ScrollView, StyleSheet, Text } from 'react-native';
import { FREE_PLAN_FEATURES, isPremiumUser, PREMIUM_PLAN_FEATURES } from '@waraqah/shared';
import { useSettings } from '../../context/SettingsContext';
import { Button, Card } from '../../components/ui';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

export function PlanBillingSettingsScreen({ navigation }) {
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const features = premium ? PREMIUM_PLAN_FEATURES : FREE_PLAN_FEATURES;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Card elevated>
                <Text style={styles.planTitle}>{premium ? 'Premium' : 'Free'} plan</Text>
                <Text style={styles.planSub}>
                    {premium ? 'You have unlimited invoices and premium features.' : 'Upgrade for unlimited invoices and branding.'}
                </Text>
                {features.map((f) => (
                    <Text key={f} style={styles.feature}>• {f}</Text>
                ))}
                {!premium ? (
                    <Button title="Upgrade to Premium" onPress={() => navigation.getParent()?.navigate('Upgrade')} style={{ marginTop: spacing.lg }} />
                ) : null}
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    planTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.foreground },
    planSub: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted, marginTop: 4, marginBottom: spacing.md },
    feature: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.slate600, marginBottom: 4 },
});
