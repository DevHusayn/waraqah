import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, FieldError, Input, Label } from '../../components/ui';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { colors, spacing } from '../../theme';

export function CompanyProfileSettingsScreen() {
    const { form, setField, errors, saving, save, loading } = useSettingsForm('profile');

    if (loading) return null;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            </Card>
            <Button title="Save" onPress={save} loading={saving} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    block: { marginBottom: spacing.lg },
});
