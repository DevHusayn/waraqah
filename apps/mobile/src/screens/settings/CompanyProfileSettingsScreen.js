import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    APP_CURRENCY,
    DEFAULT_BUSINESS_TIMEZONE,
    DEFAULT_COUNTRY,
    canCorrectBooksRebase,
    formatExchangeRateValue,
    getCountrySelectOptions,
    getCurrencyForCountry,
    getCurrencySelectOptions,
    getLastBooksRebase,
    getTimezoneForCountry,
    getTimezoneSelectOptions,
    needsBooksCurrencyRebase,
    isBooksRebaseRateError,
    normalizeCurrency,
} from '@waraqah/shared';
import { BooksCurrencyRebaseModal } from '../../components/BooksCurrencyRebaseModal';
import { Button, Card, FieldError, Input, Label } from '../../components/ui';
import { ReplayMask } from '../../components/ReplayMask';
import { SearchablePickerField, SearchablePickerSheet } from '../../components/SearchableSheetPicker';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { fontFamily, fontSize, lineHeight, spacing, useTheme } from '../../theme';

const COUNTRY_OPTIONS = getCountrySelectOptions();
const CURRENCY_OPTIONS = getCurrencySelectOptions();
const TIMEZONE_OPTIONS = getTimezoneSelectOptions({ grouped: false });

function formatRebaseDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function CompanyProfileSettingsScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [rebaseMode, setRebaseMode] = useState(null);
    const { form, setField, errors, saving, save, loading, validate, businessInfo } =
        useSettingsForm('profile', {
            onSaveError: (message) => {
                if (isBooksRebaseRateError(message)) {
                    setRebaseMode((current) => current || 'convert');
                    return true;
                }
                return false;
            },
        });
    const countrySheetRef = useRef(null);
    const currencySheetRef = useRef(null);
    const timezoneSheetRef = useRef(null);

    if (loading) return null;

    const lastRebase = getLastBooksRebase(businessInfo);
    const canCorrect = canCorrectBooksRebase(businessInfo);
    const convertFrom = normalizeCurrency(businessInfo.defaultCurrency || APP_CURRENCY);
    const convertTo = normalizeCurrency(form.defaultCurrency || APP_CURRENCY);
    const modalFrom = rebaseMode === 'correct' && lastRebase ? lastRebase.from : convertFrom;
    const modalTo = rebaseMode === 'correct' && lastRebase ? lastRebase.to : convertTo;

    const handleSave = async () => {
        if (!validate()) return;
        if (needsBooksCurrencyRebase(form.defaultCurrency, businessInfo.defaultCurrency, businessInfo.hasBooksAmounts)) {
            setRebaseMode('convert');
            return;
        }
        await save();
    };

    const handleConfirmRebase = async (rate) => {
        if (rebaseMode === 'correct') {
            const ok = await save(
                { currencyExchangeRate: rate },
                { skipValidation: true, successMessage: 'Books rate updated' }
            );
            if (ok) setRebaseMode(null);
            return;
        }

        const ok = await save(
            { currencyExchangeRate: rate },
            { successMessage: `Books converted to ${normalizeCurrency(form.defaultCurrency || APP_CURRENCY)}` }
        );
        if (ok) setRebaseMode(null);
    };

    return (
        <View style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <ReplayMask>
                    <Card style={styles.block} elevated>
                        <Label required>Business name</Label>
                        <Input value={form.name} onChangeText={(v) => setField('name', v)} error={errors.name} />
                        <FieldError message={errors.name} />
                        <Label required>Address</Label>
                        <Input value={form.address} onChangeText={(v) => setField('address', v)} error={errors.address} multiline style={{ minHeight: 72, textAlignVertical: 'top' }} />
                        <FieldError message={errors.address} />
                        <Label required>Business email</Label>
                        <Input value={form.email} onChangeText={(v) => setField('email', v)} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
                        <FieldError message={errors.email} />
                        <Label required>Phone</Label>
                        <Input value={form.phone} onChangeText={(v) => setField('phone', v)} keyboardType="phone-pad" error={errors.phone} />
                        <FieldError message={errors.phone} />
                        <Label>Website</Label>
                        <Input value={form.website || ''} onChangeText={(v) => setField('website', v)} autoCapitalize="none" />
                        <SearchablePickerField
                            label="Country"
                            value={form.country || DEFAULT_COUNTRY}
                            options={COUNTRY_OPTIONS}
                            onPress={() => countrySheetRef.current?.expand?.()}
                        />
                        <SearchablePickerField
                            label="Currency"
                            value={form.defaultCurrency || APP_CURRENCY}
                            options={CURRENCY_OPTIONS}
                            onPress={() => currencySheetRef.current?.expand?.()}
                        />
                        <SearchablePickerField
                            label="Business timezone"
                            value={form.timezone || DEFAULT_BUSINESS_TIMEZONE}
                            options={TIMEZONE_OPTIONS}
                            helperText="Used for monthly stats. Updates when you change country."
                            onPress={() => timezoneSheetRef.current?.expand?.()}
                        />
                    </Card>
                    {canCorrect && lastRebase ? (
                        <Card style={styles.block} elevated>
                            <View style={styles.correctRow}>
                                <View style={styles.correctIcon}>
                                    <Text style={styles.correctIconText}>⇄</Text>
                                </View>
                                <View style={styles.correctCopy}>
                                    <Text style={styles.correctEyebrow}>Last books conversion</Text>
                                    <Text style={styles.correctRate}>
                                        1 {lastRebase.from} = {formatExchangeRateValue(lastRebase.rate)}{' '}
                                        {lastRebase.to}
                                    </Text>
                                    <Text style={styles.correctHint}>
                                        {formatRebaseDate(lastRebase.at)
                                            ? `Converted ${formatRebaseDate(lastRebase.at)}. `
                                            : ''}
                                        Fix the rate if it was entered by mistake. Newer records are left
                                        unchanged.
                                    </Text>
                                    <Button
                                        title="Update rate"
                                        variant="secondary"
                                        onPress={() => setRebaseMode('correct')}
                                        disabled={saving}
                                        style={styles.correctBtn}
                                    />
                                </View>
                            </View>
                        </Card>
                    ) : null}
                </ReplayMask>
                <Button title="Save" onPress={handleSave} loading={saving} />
            </ScrollView>
            <SearchablePickerSheet
                sheetRef={countrySheetRef}
                title="Country"
                options={COUNTRY_OPTIONS}
                searchPlaceholder="Search countries"
                onChange={(value) => {
                    setField('country', value);
                    setField('defaultCurrency', getCurrencyForCountry(value));
                    setField('timezone', getTimezoneForCountry(value));
                }}
            />
            <SearchablePickerSheet
                sheetRef={currencySheetRef}
                title="Currency"
                options={CURRENCY_OPTIONS}
                searchPlaceholder="Search currencies"
                onChange={(value) => setField('defaultCurrency', value)}
            />
            <SearchablePickerSheet
                sheetRef={timezoneSheetRef}
                title="Business timezone"
                options={TIMEZONE_OPTIONS}
                searchPlaceholder="Search timezones"
                onChange={(value) => setField('timezone', value)}
            />
            <BooksCurrencyRebaseModal
                visible={Boolean(rebaseMode)}
                mode={rebaseMode || 'convert'}
                fromCurrency={modalFrom}
                toCurrency={modalTo}
                initialRate={rebaseMode === 'correct' && lastRebase ? lastRebase.rate : ''}
                saving={saving}
                onCancel={() => setRebaseMode(null)}
                onConfirm={handleConfirmRebase}
            />
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.surfaceMuted },
        content: { padding: spacing.lg, paddingBottom: spacing.xxl },
        block: { marginBottom: spacing.lg },
        correctRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.md,
        },
        correctIcon: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.brandSubtle || colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
        },
        correctIconText: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.md,
            color: colors.brand || colors.foreground,
        },
        correctCopy: {
            flex: 1,
            minWidth: 0,
        },
        correctEyebrow: {
            fontFamily: fontFamily.medium,
            fontSize: fontSize.xs,
            color: colors.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            marginBottom: spacing.sm,
        },
        correctRate: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.md,
            color: colors.foreground,
            marginBottom: spacing.sm,
            letterSpacing: -0.2,
        },
        correctHint: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            color: colors.muted,
            lineHeight: lineHeight.md,
            marginBottom: spacing.lg,
        },
        correctBtn: {
            alignSelf: 'flex-start',
        },
    });
}
