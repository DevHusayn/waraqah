import { useEffect, useRef, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    FREE_PLAN_FEATURES,
    PREMIUM_PLAN_FEATURES,
    canCancelPremiumAutoRenewal,
    hasPaystackSubscription,
    isPremiumAutoRenewing,
    isPremiumUser,
    premiumPriceLabel,
    premiumYearlyPriceLabel,
} from '@waraqah/shared';
import { apiFetch } from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/Modal';
import { Button, Card } from '../../components/ui';
import { colors, fontFamily, fontSize, spacing , useTheme } from '../../theme';

function formatRenewalDate(value) {
    if (!value) return null;
    return new Date(value).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function PlanBillingSettingsScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { businessInfo, refreshBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const syncAttemptedRef = useRef(false);

    const premium = isPremiumUser(businessInfo);
    const features = premium ? PREMIUM_PLAN_FEATURES : FREE_PLAN_FEATURES;
    const canCancelAutoRenewal = canCancelPremiumAutoRenewal(businessInfo);
    const isActiveSub = isPremiumAutoRenewing(businessInfo);
    const renewsAt = businessInfo.premiumUntil || businessInfo.subscriptionRenews;
    const billingInterval = businessInfo.billingInterval || 'monthly';
    const billingLabel = billingInterval === 'yearly'
        ? `Billed yearly · ${premiumYearlyPriceLabel()}/yr`
        : `Billed monthly · ${premiumPriceLabel()}/mo`;

    useEffect(() => {
        if (!premium || hasPaystackSubscription(businessInfo) || syncAttemptedRef.current) return;
        syncAttemptedRef.current = true;

        apiFetch('/payments/subscription/sync', { method: 'POST' })
            .then(() => refreshBusinessInfo())
            .catch(() => {
                syncAttemptedRef.current = false;
            });
    }, [businessInfo, premium, refreshBusinessInfo]);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            const data = await apiFetch('/payments/subscription/cancel', { method: 'POST' });
            await refreshBusinessInfo();
            showToast(data.message || 'Auto-renewal cancelled', 'success');
            setConfirmCancel(false);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Card elevated>
                <Text style={styles.planTitle}>{premium ? 'Premium' : 'Free'} plan</Text>
                <Text style={styles.planSub}>
                    {premium
                        ? 'You have unlimited sales documents and premium features.'
                        : 'Upgrade for unlimited sales documents and branding.'}
                </Text>
                {features.map((f) => (
                    <Text key={f} style={styles.feature}>• {f}</Text>
                ))}
                {!premium ? (
                    <Button
                        title="Upgrade to Premium"
                        onPress={() => navigation.getParent()?.navigate('Upgrade')}
                        style={{ marginTop: spacing.lg }}
                    />
                ) : null}
            </Card>

            {premium || businessInfo.paystackSubscriptionCode ? (
                <Card elevated style={styles.block}>
                    <Text style={styles.sectionTitle}>Manage subscription</Text>
                    <Text style={styles.billingLabel}>{billingLabel}</Text>
                    {renewsAt ? (
                        <Text style={styles.renewalText}>
                            {isActiveSub
                                ? `Renews on ${formatRenewalDate(renewsAt)}`
                                : `Premium until ${formatRenewalDate(renewsAt)}`}
                        </Text>
                    ) : null}
                    {businessInfo.subscriptionStatus === 'attention' ? (
                        <Text style={styles.warningText}>
                            Last renewal failed. Update your card in Paystack or resubscribe.
                        </Text>
                    ) : null}
                    {businessInfo.subscriptionStatus === 'cancelled' ? (
                        <Text style={styles.mutedText}>Auto-renewal is off.</Text>
                    ) : null}
                    {canCancelAutoRenewal ? (
                        <View style={styles.cancelBlock}>
                            <Text style={styles.mutedText}>
                                Auto-renewal is on. Cancel anytime — you keep Premium until the end of your billing period.
                            </Text>
                            <Button
                                title="Cancel auto-renewal"
                                variant="danger"
                                onPress={() => setConfirmCancel(true)}
                                style={{ marginTop: spacing.md }}
                            />
                        </View>
                    ) : null}
                </Card>
            ) : null}

            <ConfirmModal
                visible={confirmCancel}
                title="Cancel auto-renewal?"
                message="You keep Premium until the end of your current billing period. After that, your account returns to the free plan."
                confirmLabel="Cancel auto-renewal"
                danger
                loading={cancelling}
                onConfirm={handleCancel}
                onCancel={() => setConfirmCancel(false)}
            />
        </ScrollView>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    block: { marginTop: 0 },
    planTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.foreground },
    planSub: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted, marginTop: 4, marginBottom: spacing.md },
    feature: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.slate600, marginBottom: 4 },
    sectionTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.foreground, marginBottom: spacing.sm },
    billingLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.foreground },
    renewalText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.slate600, marginTop: spacing.xs },
    warningText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.warning, marginTop: spacing.sm },
    mutedText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.sm },
    cancelBlock: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
}
