import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    validateEmail,
    validateRequired,
    isStrongPassword,
    getPasswordStrength,
    PASSWORD_REQUIREMENTS_MESSAGE,
    APP_CURRENCY,
} from '@waraqah/shared';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WaraqahLogo } from '../components/WaraqahLogo';
import { Button, FieldError, Input, Label } from '../components/ui';
import { colors } from '../theme/colors';

function AuthTabs({ isLogin, onSwitch, disabled }) {
    return (
        <View style={styles.tabs}>
            {[
                ['Sign in', true],
                ['Register', false],
            ].map(([label, login]) => (
                <Pressable
                    key={label}
                    disabled={disabled}
                    onPress={() => onSwitch(login)}
                    style={[styles.tab, isLogin === login && styles.tabActive]}
                >
                    <Text style={[styles.tabText, isLogin === login && styles.tabTextActive]}>{label}</Text>
                </Pressable>
            ))}
        </View>
    );
}

export function AuthScreen() {
    const { login, register, forgotPassword } = useAuth();
    const { showToast } = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        businessEmail: '',
        address: '',
        phone: '',
        website: '',
        brandColor: '#0284c7',
    });
    const [errors, setErrors] = useState({});

    const setField = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
    };

    const validate = () => {
        const next = {};
        next.email = validateEmail(form.email, 'Enter your email.', 'Enter a valid email.');
        next.password = validateRequired(form.password, 'Enter your password.');
        if (!isLogin) {
            if (!form.confirmPassword.trim()) next.confirmPassword = 'Confirm your password.';
            else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
            if (form.password && !isStrongPassword(form.password)) {
                next.password = PASSWORD_REQUIREMENTS_MESSAGE;
            }
            next.name = validateRequired(form.name, 'Enter your business name.');
            next.businessEmail = validateEmail(
                form.businessEmail,
                'Enter your business email.',
                'Enter a valid business email.'
            );
            next.address = validateRequired(form.address, 'Enter your address.');
            next.phone = validateRequired(form.phone, 'Enter your phone number.');
        }
        setErrors(next);
        return !Object.values(next).some(Boolean);
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (isLogin) {
                await login(form.email, form.password);
                showToast('Welcome back!', 'success');
            } else {
                await register(form.email, form.password, {
                    name: form.name,
                    address: form.address,
                    email: form.businessEmail,
                    phone: form.phone,
                    website: form.website,
                    defaultCurrency: APP_CURRENCY,
                    brandColor: form.brandColor,
                });
                showToast('Account created!', 'success');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async () => {
        const emailErr = validateEmail(forgotEmail, 'Enter your email.', 'Enter a valid email.');
        if (emailErr) {
            showToast(emailErr, 'error');
            return;
        }
        setLoading(true);
        try {
            const data = await forgotPassword(forgotEmail);
            setShowForgot(false);
            showToast(data.message || 'Check your email for reset instructions.', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const strength = !isLogin ? getPasswordStrength(form.password) : null;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <WaraqahLogo size="lg" />
                <AuthTabs isLogin={isLogin} onSwitch={setIsLogin} disabled={loading} />
            </View>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.formScroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.heading}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
                    <Text style={styles.subheading}>
                        {isLogin ? 'Sign in to manage your invoices' : 'Start invoicing in under a minute'}
                    </Text>

                    <View style={styles.formCard}>
                        <Label required>Email</Label>
                        <Input
                            value={form.email}
                            onChangeText={(v) => setField('email', v)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            error={errors.email}
                        />
                        <FieldError message={errors.email} />

                        <Label required>Password</Label>
                        <Input
                            value={form.password}
                            onChangeText={(v) => setField('password', v)}
                            secureTextEntry
                            error={errors.password}
                        />
                        <FieldError message={errors.password} />
                        {strength?.label ? (
                            <Text style={{ fontSize: 12, color: colors.slate500, marginTop: 4 }}>{strength.label}</Text>
                        ) : null}

                        {isLogin ? (
                            <Pressable onPress={() => setShowForgot(true)} style={styles.forgot}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </Pressable>
                        ) : (
                            <>
                                <Label required>Confirm password</Label>
                                <Input
                                    value={form.confirmPassword}
                                    onChangeText={(v) => setField('confirmPassword', v)}
                                    secureTextEntry
                                    error={errors.confirmPassword}
                                />
                                <FieldError message={errors.confirmPassword} />

                                <Text style={styles.sectionLabel}>BUSINESS DETAILS</Text>
                                <Label required>Business name</Label>
                                <Input value={form.name} onChangeText={(v) => setField('name', v)} error={errors.name} />
                                <FieldError message={errors.name} />

                                <Label required>Business email</Label>
                                <Input
                                    value={form.businessEmail}
                                    onChangeText={(v) => setField('businessEmail', v)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    error={errors.businessEmail}
                                />
                                <FieldError message={errors.businessEmail} />

                                <Label required>Address</Label>
                                <Input value={form.address} onChangeText={(v) => setField('address', v)} error={errors.address} />
                                <FieldError message={errors.address} />

                                <Label required>Phone</Label>
                                <Input value={form.phone} onChangeText={(v) => setField('phone', v)} keyboardType="phone-pad" error={errors.phone} />
                                <FieldError message={errors.phone} />
                            </>
                        )}

                        <Button
                            title={isLogin ? 'Sign in' : 'Create account'}
                            onPress={handleSubmit}
                            loading={loading}
                            style={{ marginTop: 16 }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showForgot} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.heading}>Reset password</Text>
                        <Label required>Email</Label>
                        <Input value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" autoCapitalize="none" />
                        <Button title="Send reset link" onPress={handleForgot} loading={loading} style={{ marginTop: 12 }} />
                        <Button title="Cancel" variant="secondary" onPress={() => setShowForgot(false)} style={{ marginTop: 8 }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.slate50 },
    flex: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: colors.slate50,
        borderBottomWidth: 1,
        borderBottomColor: colors.slate200,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 4,
        marginTop: 16,
        borderWidth: 1,
        borderColor: colors.slate200,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    tabActive: { backgroundColor: colors.brand },
    tabText: { fontWeight: '600', color: colors.slate600 },
    tabTextActive: { color: colors.white },
    formScroll: { padding: 16, paddingBottom: 32 },
    heading: { fontSize: 24, fontWeight: '700', color: colors.slate900 },
    subheading: { fontSize: 15, color: colors.slate500, marginTop: 4, marginBottom: 16 },
    formCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.slate200,
        gap: 4,
    },
    forgot: { alignSelf: 'flex-end', marginTop: 8 },
    forgotText: { color: colors.brand, fontWeight: '600' },
    sectionLabel: {
        marginTop: 12,
        marginBottom: 4,
        fontSize: 11,
        fontWeight: '700',
        color: colors.slate400,
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 32,
    },
});
