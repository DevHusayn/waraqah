import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    APP_CURRENCY,
    BRAND_PRESETS,
    DEFAULT_COUNTRY,
    REGISTER_INITIAL_FORM,
    REGISTER_STEPS,
    ANALYTICS_EVENTS,
    getCountrySelectOptions,
    getCurrencyForCountry,
    getCurrencySelectOptions,
    getPasswordStrength,
    validateRegisterStep,
} from '@waraqah/shared';
import { useAuth } from '../../context/AuthContext';
import { captureEvent } from '../../monitoring/posthog';
import { useToast } from '../../context/ToastContext';
import { Button, FieldError, Input, Label, Subtitle, Title } from '../ui';
import { ReplayMask } from '../ReplayMask';
import { SearchablePickerField, SearchablePickerSheet } from '../SearchableSheetPicker';
import { fontFamily, fontSize, radii, spacing, useTheme } from '../../theme';
import { hapticSuccess } from '../../utils/haptics';

const COUNTRY_OPTIONS = getCountrySelectOptions();
const CURRENCY_OPTIONS = getCurrencySelectOptions();

export function RegisterWizard({ onComplete }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { register } = useAuth();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [form, setForm] = useState({
        ...REGISTER_INITIAL_FORM,
        country: DEFAULT_COUNTRY,
        defaultCurrency: APP_CURRENCY,
    });
    const [errors, setErrors] = useState({});
    const countrySheetRef = useRef(null);
    const currencySheetRef = useRef(null);

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
            const data = await register(form.email, form.password, {
                name: form.name,
                address: form.address,
                email: form.businessEmail,
                phone: form.phone,
                website: form.website,
                country: form.country || DEFAULT_COUNTRY,
                defaultCurrency: form.defaultCurrency || APP_CURRENCY,
                brandColor: form.brandColor,
                paymentAccountName: form.paymentAccountName,
                paymentBankName: form.paymentBankName,
                paymentAccountNumber: form.paymentAccountNumber,
                paymentSortCode: form.paymentSortCode,
                paymentIban: form.paymentIban,
                paymentSwift: form.paymentSwift,
                paymentInstructions: form.paymentInstructions,
            });
            captureEvent(ANALYTICS_EVENTS.USER_SIGNED_UP, { auth_method: 'local' });
            hapticSuccess();
            showToast(data?.message || 'Check your email to verify your account.', 'success');
            onComplete?.({ email: form.email.trim().toLowerCase() });
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
        <View>
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

            <ReplayMask>
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
                    <SearchablePickerField
                        label="Country"
                        value={form.country || DEFAULT_COUNTRY}
                        options={COUNTRY_OPTIONS}
                        helperText="Suggests a currency. You can still pick a different one."
                        onPress={() => countrySheetRef.current?.expand?.()}
                    />
                    <SearchablePickerField
                        label="Currency"
                        value={form.defaultCurrency || APP_CURRENCY}
                        options={CURRENCY_OPTIONS}
                        helperText="Used on invoices and reports."
                        onPress={() => currencySheetRef.current?.expand?.()}
                    />
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
                    <Label>Sort code / routing number</Label>
                    <Input value={form.paymentSortCode} onChangeText={(v) => setField('paymentSortCode', v)} autoCapitalize="characters" />
                    <Label>IBAN</Label>
                    <Input value={form.paymentIban} onChangeText={(v) => setField('paymentIban', v)} autoCapitalize="characters" />
                    <Label>SWIFT / BIC</Label>
                    <Input value={form.paymentSwift} onChangeText={(v) => setField('paymentSwift', v)} autoCapitalize="characters" />
                    <Label>Payment instructions</Label>
                    <Input
                        value={form.paymentInstructions}
                        onChangeText={(v) => setField('paymentInstructions', v)}
                        multiline
                        style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
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
            </ReplayMask>

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
            <SearchablePickerSheet
                sheetRef={countrySheetRef}
                title="Country"
                options={COUNTRY_OPTIONS}
                searchPlaceholder="Search countries"
                onChange={(value) => {
                    setField('country', value);
                    setField('defaultCurrency', getCurrencyForCountry(value));
                }}
            />
            <SearchablePickerSheet
                sheetRef={currencySheetRef}
                title="Currency"
                options={CURRENCY_OPTIONS}
                searchPlaceholder="Search currencies"
                onChange={(value) => setField('defaultCurrency', value)}
            />
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
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
}
