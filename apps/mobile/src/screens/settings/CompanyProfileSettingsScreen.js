import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    APP_CURRENCY,
    DEFAULT_BUSINESS_TIMEZONE,
    DEFAULT_COUNTRY,
    getCountrySelectOptions,
    getCurrencyForCountry,
    getCurrencySelectOptions,
    getTimezoneForCountry,
    getTimezoneSelectOptions,
} from '@waraqah/shared';
import { Button, Card, FieldError, Input, Label } from '../../components/ui';
import { ReplayMask } from '../../components/ReplayMask';
import { SearchablePickerField, SearchablePickerSheet } from '../../components/SearchableSheetPicker';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { spacing, useTheme } from '../../theme';

const COUNTRY_OPTIONS = getCountrySelectOptions();
const CURRENCY_OPTIONS = getCurrencySelectOptions();
const TIMEZONE_OPTIONS = getTimezoneSelectOptions({ grouped: false });

export function CompanyProfileSettingsScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { form, setField, errors, saving, save, loading } = useSettingsForm('profile');
    const countrySheetRef = useRef(null);
    const currencySheetRef = useRef(null);
    const timezoneSheetRef = useRef(null);

    if (loading) return null;

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
                </ReplayMask>
                <Button title="Save" onPress={save} loading={saving} />
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
        </View>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    block: { marginBottom: spacing.lg },
});
}
