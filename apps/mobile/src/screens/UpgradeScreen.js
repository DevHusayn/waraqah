import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
    PREMIUM_PLAN_FEATURES,
    PREMIUM_PRICE_NGN,
    premiumPriceLabel,
    isPremiumUser,
} from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, PageHeader, PageLoader } from '../components/ui';
import { colors, spacing } from '../theme';

const CALLBACK_SCHEME = 'waraqah://upgrade/callback';

export function UpgradeScreen() {
    const { businessInfo, refreshBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    const premium = isPremiumUser(businessInfo);
    const monthlyAmount = plan?.amount ?? PREMIUM_PRICE_NGN;

    useEffect(() => {
        apiFetch('/payments/plan')
            .then(setPlan)
            .catch((err) => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);

    useEffect(() => {
        const sub = Linking.addEventListener('url', async ({ url }) => {
            if (!url.includes('upgrade/callback')) return;
            const { queryParams } = Linking.parse(url);
            const reference = queryParams?.reference;
            if (!reference) return;
            try {
                await apiFetch(`/payments/verify/${reference}`);
                await refreshBusinessInfo();
                showToast('Premium activated!', 'success');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
        return () => sub.remove();
    }, [refreshBusinessInfo, showToast]);

    const handlePay = async () => {
        setPaying(true);
        try {
            const { authorization_url } = await apiFetch('/payments/initialize', {
                method: 'POST',
                body: JSON.stringify({ callbackOrigin: CALLBACK_SCHEME }),
            });
            await WebBrowser.openAuthSessionAsync(authorization_url, CALLBACK_SCHEME);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setPaying(false);
        }
    };

    const handleCancel = async () => {
        try {
            await apiFetch('/payments/subscription/cancel', { method: 'POST' });
            await refreshBusinessInfo();
            showToast('Auto-renewal cancelled', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (loading) return <PageLoader />;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <PageHeader title="Upgrade to Premium" subtitle={`${premiumPriceLabel(monthlyAmount)}/month`} />

            {premium ? (
                <Card style={styles.block}>
                    <Text style={styles.active}>You are on Premium</Text>
                    <Button title="Cancel auto-renewal" variant="secondary" onPress={handleCancel} style={{ marginTop: 12 }} />
                </Card>
            ) : (
                <Button title={`Pay ${premiumPriceLabel(monthlyAmount)}`} onPress={handlePay} loading={paying} style={{ marginBottom: 16 }} />
            )}

            <Card style={styles.block}>
                <Text style={styles.section}>Premium includes</Text>
                {PREMIUM_PLAN_FEATURES.map((f) => (
                    <Text key={f} style={styles.feature}>• {f}</Text>
                ))}
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    block: { marginBottom: 12 },
    section: { fontWeight: '700', marginBottom: 8 },
    feature: { color: colors.slate600, marginBottom: 4 },
    active: { color: colors.green600, fontWeight: '700', fontSize: 16 },
});
