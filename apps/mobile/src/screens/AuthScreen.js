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
} from '@waraqah/shared';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RegisterWizard } from '../components/auth/RegisterWizard';
import { WaraqahLogo } from '../components/WaraqahLogo';
import { Button, FieldError, Input, Label } from '../components/ui';
import { colors, fontFamily, fontSize, radii, spacing } from '../theme';
import { hapticSuccess } from '../utils/haptics';

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
    const { login, forgotPassword } = useAuth();
    const { showToast } = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});

    const setField = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
    };

    const validateLogin = () => {
        const next = {
            email: validateEmail(form.email, 'Enter your email.', 'Enter a valid email.'),
            password: validateRequired(form.password, 'Enter your password.'),
        };
        setErrors(next);
        return !Object.values(next).some(Boolean);
    };

    const handleSubmit = async () => {
        if (!validateLogin()) return;
        setLoading(true);
        try {
            await login(form.email, form.password);
            hapticSuccess();
            showToast('Welcome back!', 'success');
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

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.header}>
                <WaraqahLogo size="lg" />
                <AuthTabs isLogin={isLogin} onSwitch={setIsLogin} disabled={loading} />
            </View>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView style={styles.flex} contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
                    {isLogin ? (
                        <>
                            <Text style={styles.heading}>Welcome back</Text>
                            <Text style={styles.subheading}>Sign in to manage your invoices</Text>
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
                                <Pressable onPress={() => setShowForgot(true)} style={styles.forgot}>
                                    <Text style={styles.forgotText}>Forgot password?</Text>
                                </Pressable>
                                <Button title="Sign in" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.lg }} />
                            </View>
                        </>
                    ) : (
                        <View style={styles.formCard}>
                            <RegisterWizard />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={showForgot} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.heading}>Reset password</Text>
                        <Label required>Email</Label>
                        <Input value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" autoCapitalize="none" />
                        <Button title="Send reset link" onPress={handleForgot} loading={loading} style={{ marginTop: spacing.md }} />
                        <Button title="Cancel" variant="secondary" onPress={() => setShowForgot(false)} style={{ marginTop: spacing.sm }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surfaceMuted },
    flex: { flex: 1 },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.surfaceMuted,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        padding: 4,
        marginTop: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: 'center' },
    tabActive: { backgroundColor: colors.brand },
    tabText: { fontFamily: fontFamily.semibold, color: colors.slate600 },
    tabTextActive: { color: colors.white },
    formScroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    heading: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.foreground },
    subheading: { fontFamily: fontFamily.regitional, fontSize: fontSize.sm, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
    formCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    forgot: { alignSelf: 'flex-end', marginTop: spacing.sm },
    forgotText: { fontFamily: fontFamily.semibold, color: colors.brand },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBox: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
});
