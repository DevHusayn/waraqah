import { useState, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui';
import { colors, fontFamily, fontSize, radii, spacing, useTheme } from '../theme';

export function CheckEmailScreen({ navigation, route }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const email = route.params?.email || '';
    const { resendVerificationEmail } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const resend = async () => {
        if (!email) {
            showToast('Enter your email on the sign-in screen to resend.', 'error');
            return;
        }
        setLoading(true);
        try {
            const data = await resendVerificationEmail(email);
            showToast(data.message || 'Verification email sent.', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Mail size={36} color={colors.brand} strokeWidth={1.75} />
                </View>
                <Text style={styles.heading}>Check your email</Text>
                <Text style={styles.sub}>
                    We sent a verification link{email ? ` to ${email}` : ''}. Verify your address, then sign in to
                    continue.
                </Text>
                <Button title="Back to sign in" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.xl }} />
                <Button title="Resend email" variant="secondary" onPress={resend} loading={loading} style={{ marginTop: spacing.sm }} />
            </View>
        </SafeAreaView>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrap: {
        width: 88,
        height: 88,
        borderRadius: radii.xl,
        backgroundColor: colors.brandLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    heading: {
        fontFamily: fontFamily.bold,
        fontWeight: '800',
        fontSize: 26,
        color: colors.foreground,
        textAlign: 'center',
        letterSpacing: -0.4,
    },
    sub: {
        marginTop: spacing.sm,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        textAlign: 'center',
        lineHeight: 22,
    },
});
}
