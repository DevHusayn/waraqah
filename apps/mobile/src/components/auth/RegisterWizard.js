import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    APP_CURRENCY,
    BRAND_PRESETS,
    REGISTER_INITIAL_FORM,
    REGISTER_STEPS,
    getPasswordStrength,
    validateRegisterStep,
} from '@waraqah/shared';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, FieldError, Input, Label, Subtitle, Title } from '../ui';
import { colors, fontFamily, fontSize, radii, spacing } from '../../theme';
import { hapticSuccess } from '../../utils/haptics';

export function RegisterWizard({ onComplete }) {
    const { register } = useAuth();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [form, setForm] = useState({ ...REGISTER_INITIAL_FORM, defaultCurrency: APP_CURRENCY });
    const [errors, setErrors] = useState({});

    const current = REGISTER_STEPS[step - 1];
    const strength = getPasswordStrength(form.password);

    const setField = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
    };

    const goNext = async () => {
        const { errors: nextErrors } = validateRegisterStep(step, form, confirmPassword);
        setErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        if (step < REGISTER_STEPS.length) {
            setStep((s) => s + 1);
            return;
        }

        setLoading(true);
        try {
            await register(form.email, form.password, {
                name: form.name,
                address: form.address,
                email: form.businessEmail,
                phone: form.phone,
                website: form.website,
                defaultCurrency: APP_CURRENCY,
                brandColor: form.brandColor,
                paymentAccountName: form.paymentAccountName,
                paymentBankName: form.paymentBankName,
                paymentAccountNumber: form.paymentAccountNumber,
                paymentInstructions: form.paymentInstructions,
            });
            hapticSuccess();
            showToast('Account created!', 'success');
            onComplete?.();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        if (step > 1) setStep((s) => s - 1);
    };

    return (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.progress}>
                {REGISTER_STEPS.map((s) => (
                    <View
                        key={s.id}
                        style={[styles.dot, s.id <= step && styles.dotActive, s.id === step && styles.dotCurrent]}
                    />
                ))}
            </View>
            <Title>{current.title}</Title>
            <Subtitle>{current.subtitle}</Subtitle>

            {step === 1 ? (
                <View style={styles.fields}>
                    <Label required>Email</Label>
                    <Input value={form.email} onChangeText={(v) => setField('email', v)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
                    <FieldError message={errors.email} />
                    <Label required>Password</Label>
                    <Input value={form.password} onChangeText={(v) => setField('password', v)} secureTextEntry error={errors.password} />
                    <FieldError message={errors.password} />
                    {form.password ? (
                        <View style={styles.strengthBar}>
                            <View style={[styles.strengthFill, { width: `${strength.percent}%`, backgroundColor: strength.color || colors.brand }]} />
                        </View>
                    ) : null}
                    <Label required>Confirm password</Label>
                    <Input value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirmPassword} />
                    <FieldError message={errors.confirmPassword} />
                </View>
            ) : null}

            {step === 2 ? (
                <View style={styles.fields}>
                    <Label required>Business name</Label>
                    <Input value={form.name} onChangeText={(v) => setField('name', v)} error={errors.name} />
                    <FieldError message={errors.name} />
                    <Label>Business email (optional)</Label>
                    <Input value={form.businessEmail} onChangeText={(v) => setField('businessEmail', v)} autoCapitalize="none" keyboardType="email-address" error={errors.businessEmail} />
                    <FieldError message={errors.businessEmail} />
                    <Label>Address (optional)</Label>
                    <Input value={form.address} onChangeText={(v) => setField('address', v)} error={errors.address} multiline style={{ minHeight: 72, textAlignVertical: 'top' }} />
                    <FieldError message={errors.address} />
                    <Label>Phone (optional)</Label>
                    <Input value={form.phone} onChangeText={(v) => setField('phone', v)} keyboardType="phone-pad" error={errors.phone} />
                    <FieldError message={errors.phone} />
                    <Label>Website</Label>
                    <Input value={form.website} onChangeText={(v) => setField('website', v)} autoCapitalize="none" />
                </View>
            ) : null}

            {step === 3 ? (
                <View style={styles.fields}>
                    <Text style={styles.optional}>All fields optional — skip if not ready.</Text>
                    <Label>Account name</Label>
                    <Input value={form.paymentAccountName} onChangeText={(v) => setField('paymentAccountName', v)} error={errors.paymentAccountName} />
                    <FieldError message={errors.paymentAccountName} />
                    <Label>Bank name</Label>
                    <Input value={form.paymentBankName} onChangeText={(v) => setField('paymentBankName', v)} error={errors.paymentBankName} />
                    <FieldError message={errors.paymentBankName} />
                    <Label>Account number</Label>
                    <Input value={form.paymentAccountNumber} onChangeText={(v) => setField('paymentAccountNumber', v)} keyboardType="number-pad" error={errors.paymentAccountNumber} />
                    <FieldError message={errors.paymentAccountNumber} />
                </View>
            ) : null}

            {step === 4 ? (
                <View style={styles.fields}>
                    <Label required>Brand color</Label>
                    <Input value={form.brandColor} onChangeText={(v) => setField('brandColor', v)} autoCapitalize="none" error={errors.brandColor} />
                    <FieldError message={errors.brandColor} />
                    <View style={styles.presets}>
                        {BRAND_PRESETS.map((p) => (
                            <Pressable
                                key={p.color}
                                onPress={() => setField('brandColor', p.color)}
                                style={[styles.swatch, { backgroundColor: p.color }, form.brandColor === p.color && styles.swatchActive]}
                            />
                        ))}
                    </View>
                </View>
            ) : null}

            <View style={styles.actions}>
                {step > 1 ? <Button title="Back" variant="secondary" onPress={goBack} style={{ flex: 1 }} /> : null}
                <Button
                    title={step === REGISTER_STEPS.length ? 'Create account' : 'Continue'}
                    onPress={goNext}
                    loading={loading}
                    style={{ flex: 1 }}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    progress: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    dot: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.slate200,
    },
    dotActive: {
        backgroundColor: colors.brandLight,
    },
    dotCurrent: {
        backgroundColor: colors.brand,
    },
    fields: {
        marginTop: spacing.lg,
    },
    optional: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginBottom: spacing.md,
    },
    strengthBar: {
        height: 4,
        backgroundColor: colors.slate200,
        borderRadius: 2,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    presets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    swatch: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
    },
    swatchActive: {
        borderWidth: 3,
        borderColor: colors.foreground,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
});
