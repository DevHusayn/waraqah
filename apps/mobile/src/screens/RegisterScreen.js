import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterWizard } from '../components/auth/RegisterWizard';
import { colors, fontFamily, fontSize, spacing } from '../theme';

export function RegisterScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                    <Text style={styles.back}>← Back</Text>
                </Pressable>
                <Text style={styles.heading}>Create your account</Text>
                <Text style={styles.sub}>Set up your business profile and start invoicing.</Text>
            </View>
            <View style={styles.body}>
                <RegisterWizard
                    onComplete={(payload) => {
                        navigation.replace('CheckEmail', { email: payload?.email || '' });
                    }}
                />
            </View>
            <Pressable onPress={() => navigation.navigate('Login')} style={styles.switchRow}>
                <Text style={styles.switchText}>
                    Already have an account? <Text style={styles.link}>Sign in</Text>
                </Text>
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    body: { flex: 1, paddingHorizontal: spacing.xl },
    back: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginBottom: spacing.md,
    },
    heading: {
        fontFamily: fontFamily.bold,
        fontWeight: '800',
        fontSize: 26,
        color: colors.foreground,
        letterSpacing: -0.4,
    },
    sub: {
        marginTop: spacing.xs,
        marginBottom: spacing.md,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
    },
    switchRow: { padding: spacing.xl, alignItems: 'center' },
    switchText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted },
    link: { color: colors.brand, fontFamily: fontFamily.semibold },
});
