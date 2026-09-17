import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    buildChangePasswordFieldErrors,
    CHANGE_PASSWORD_FIELD_ORDER,
    firstFieldError,
    getPasswordStrength,
} from '@waraqah/shared';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button, Card, FieldError, Input, Label } from '../../components/ui';
import { ReplayMask } from '../../components/ReplayMask';
import { fontFamily, fontSize, lineHeight, spacing, useTheme } from '../../theme';

const EMPTY_FORM = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
};

export function ChangePasswordScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { user, changePassword } = useAuth();
    const { showToast } = useToast();
    const usesGoogle = (user?.authProvider || 'local') === 'google';

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const passwordStrength = getPasswordStrength(form.newPassword);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
    };

    const handleSubmit = async () => {
        const nextErrors = buildChangePasswordFieldErrors(form);
        const firstInvalid = firstFieldError(nextErrors, CHANGE_PASSWORD_FIELD_ORDER);
        if (firstInvalid) {
            setErrors(nextErrors);
            return;
        }
        setErrors({});
        setSaving(true);
        try {
            const data = await changePassword(form.currentPassword, form.newPassword);
            setForm(EMPTY_FORM);
            showToast(data.message || 'Your password has been updated.', 'success');
            if (navigation?.canGoBack?.()) {
                navigation.goBack();
            }
        } catch (err) {
            const message = err.message || 'Could not update password.';
            if (/current password is incorrect/i.test(message)) {
                setErrors({ currentPassword: message });
            } else {
                setErrors({ form: message });
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {usesGoogle ? (
                <Card elevated>
                    <Text style={styles.title}>Google sign-in</Text>
                    <Text style={styles.body}>
                        This account uses Google to sign in, so there is no Waraqah password to change.
                        Use your Google account if you need to update how you access Waraqah.
                    </Text>
                </Card>
            ) : (
                <>
                    <Text style={styles.hint}>Enter your current password, then choose a new one.</Text>
                    <ReplayMask>
                        <Card elevated>
                            <View>
                                <Label required>Current password</Label>
                                <Input
                                    value={form.currentPassword}
                                    onChangeText={(value) => setField('currentPassword', value)}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="password"
                                    textContentType="password"
                                    error={errors.currentPassword}
                                />
                                <FieldError message={errors.currentPassword} />
                            </View>

                            <View style={styles.field}>
                                <Label required>New password</Label>
                                <Input
                                    value={form.newPassword}
                                    onChangeText={(value) => setField('newPassword', value)}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="password-new"
                                    textContentType="newPassword"
                                    error={errors.newPassword}
                                />
                                {form.newPassword ? (
                                    <View style={styles.strength}>
                                        <View style={styles.strengthTrack}>
                                            <View
                                                style={[
                                                    styles.strengthBar,
                                                    {
                                                        width: `${passwordStrength.percent}%`,
                                                        backgroundColor: passwordStrength.color,
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                            {passwordStrength.label}
                                        </Text>
                                    </View>
                                ) : null}
                                <FieldError message={errors.newPassword} />
                            </View>

                            <View style={styles.field}>
                                <Label required>Confirm new password</Label>
                                <Input
                                    value={form.confirmPassword}
                                    onChangeText={(value) => setField('confirmPassword', value)}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="password-new"
                                    textContentType="newPassword"
                                    error={errors.confirmPassword}
                                />
                                <FieldError message={errors.confirmPassword} />
                                <FieldError message={errors.form} />
                            </View>
                        </Card>
                    </ReplayMask>
                    <Button title="Update password" onPress={handleSubmit} loading={saving} />
                </>
            )}
        </ScrollView>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
        screen: { flex: 1, backgroundColor: colors.surfaceMuted },
        content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
        hint: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            lineHeight: lineHeight.sm,
            color: colors.muted,
        },
        field: { marginTop: spacing.lg },
        title: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.md,
            color: colors.foreground,
            marginBottom: spacing.sm,
        },
        body: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.sm,
            lineHeight: lineHeight.sm,
            color: colors.muted,
        },
        strength: { marginTop: 6, marginBottom: 4 },
        strengthTrack: {
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.slate100,
            overflow: 'hidden',
        },
        strengthBar: { height: 4, borderRadius: 999 },
        strengthLabel: {
            marginTop: 4,
            fontFamily: fontFamily.medium,
            fontSize: fontSize.xs,
        },
    });
}
