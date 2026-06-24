import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Card, FieldError, Input, Label } from '../../components/ui';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

export function AccountDetailsSettingsScreen() {
    const { form, setField, errors, saving, save, loading } = useSettingsForm('account');

    if (loading) return null;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.hint}>Optional — shown on invoices so clients know how to pay you.</Text>
            <Card style={styles.block} elevated>
                <Label>Account name</Label>
                <Input value={form.paymentAccountName || ''} onChangeText={(v) => setField('paymentAccountName', v)} error={errors.paymentAccountName} />
                <FieldError message={errors.paymentAccountName} />
                <Label>Bank name</Label>
                <Input value={form.paymentBankName || ''} onChangeText={(v) => setField('paymentBankName', v)} error={errors.paymentBankName} />
                <FieldError message={errors.paymentBankName} />
                <Label>Account number</Label>
                <Input value={form.paymentAccountNumber || ''} onChangeText={(v) => setField('paymentAccountNumber', v)} keyboardType="number-pad" error={errors.paymentAccountNumber} />
                <FieldError message={errors.paymentAccountNumber} />
                <Label>Payment instructions</Label>
                <Input value={form.paymentInstructions || ''} onChangeText={(v) => setField('paymentInstructions', v)} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
            </Card>
            <Button title="Save" onPress={save} loading={saving} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    block: { marginBottom: spacing.lg },
    hint: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginBottom: spacing.md,
    },
});
