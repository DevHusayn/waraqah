import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, forgotPasswordSchema } from '../schemas/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WaraqahLogo } from '../components/WaraqahLogo';
import { Button, FieldError, Input, Label } from '../components/ui';
import { colors, fontFamily, fontSize, spacing } from '../theme';
import { hapticSuccess } from '../utils/haptics';

export function LoginScreen({ navigation }) {
    const { login, forgotPassword } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const forgotForm = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onLogin = async (values) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            hapticSuccess();
            showToast('Welcome back!', 'success');
        } catch (err) {
            if (err.code === 'EMAIL_NOT_VERIFIED') {
                navigation.navigate('CheckEmail', { email: values.email });
                return;
            }
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const onForgot = async (values) => {
        setLoading(true);
        try {
            const data = await forgotPassword(values.email);
            setShowForgot(false);
            showToast(data.message || 'Check your email for reset instructions.', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                        <Text style={styles.back}>← Back</Text>
                    </Pressable>

                    <WaraqahLogo />
                    <Text style={styles.heading}>Welcome back</Text>
                    <Text style={styles.sub}>Sign in to manage quotations and invoices.</Text>

                    {!showForgot ? (
                        <View style={styles.form}>
                            <Label>Email</Label>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoComplete="email"
                                        placeholder="you@business.com"
                                        accessibilityLabel="Email"
                                    />
                                )}
                            />
                            <FieldError message={errors.email?.message} />

                            <View style={{ marginTop: spacing.md }}>
                                <Label>Password</Label>
                            </View>
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        secureTextEntry
                                        autoComplete="password"
                                        placeholder="Your password"
                                        accessibilityLabel="Password"
                                    />
                                )}
                            />
                            <FieldError message={errors.password?.message} />

                            <Pressable
                                onPress={() => {
                                    forgotForm.setValue('email', getValues('email'));
                                    setShowForgot(true);
                                }}
                                style={styles.forgotLink}
                            >
                                <Text style={styles.link}>Forgot password?</Text>
                            </Pressable>

                            <Button title="Sign in" onPress={handleSubmit(onLogin)} loading={loading} style={{ marginTop: spacing.md }} />
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <Text style={styles.forgotTitle}>Reset password</Text>
                            <Text style={styles.sub}>We’ll email you a link to set a new password.</Text>
                            <Label>Email</Label>
                            <Controller
                                control={forgotForm.control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        placeholder="you@business.com"
                                    />
                                )}
                            />
                            <FieldError message={forgotForm.formState.errors.email?.message} />
                            <Button
                                title="Send reset link"
                                onPress={forgotForm.handleSubmit(onForgot)}
                                loading={loading}
                                style={{ marginTop: spacing.md }}
                            />
                            <Button title="Back to sign in" variant="secondary" onPress={() => setShowForgot(false)} style={{ marginTop: spacing.sm }} />
                        </View>
                    )}

                    <Pressable onPress={() => navigation.navigate('Register')} style={styles.switchRow}>
                        <Text style={styles.switchText}>
                            New to Waraqah? <Text style={styles.link}>Create account</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    content: { padding: spacing.xl, paddingBottom: spacing.huge },
    back: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: colors.muted,
        marginBottom: spacing.xl,
    },
    heading: {
        marginTop: spacing.xxl,
        fontFamily: fontFamily.bold,
        fontWeight: '800',
        fontSize: 28,
        color: colors.foreground,
        letterSpacing: -0.5,
    },
    sub: {
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        lineHeight: 22,
    },
    form: { marginTop: spacing.sm },
    forgotLink: { alignSelf: 'flex-end', marginTop: spacing.md, minHeight: 44, justifyContent: 'center' },
    forgotTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        marginBottom: spacing.xs,
    },
    link: { color: colors.brand, fontFamily: fontFamily.semibold },
    switchRow: { marginTop: spacing.xxl, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
    switchText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted },
});
