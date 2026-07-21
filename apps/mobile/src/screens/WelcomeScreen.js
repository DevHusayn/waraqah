import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WaraqahLogo } from '../components/WaraqahLogo';
import { Button } from '../components/ui';
import { APP_TAGLINE } from '../constants/brand';
import { colors, fontFamily, fontSize, lineHeight, spacing } from '../theme';

export function WelcomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.hero}>
                <View style={styles.atmosphere} />
                <Animated.View entering={FadeInDown.duration(480)} style={styles.brandBlock}>
                    <WaraqahLogo size="lg" />
                    <Text style={styles.tagline}>{APP_TAGLINE}</Text>
                    <Text style={styles.subtitle}>
                        Create invoices, track payments, and grow your business — designed for how you work on mobile.
                    </Text>
                </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(100).duration(420)} style={styles.actions}>
                <Button title="Sign in" onPress={() => navigation.navigate('Login')} />
                <Button
                    title="Create account"
                    variant="secondary"
                    onPress={() => navigation.navigate('Register')}
                    style={{ marginTop: spacing.sm }}
                />
                <Text style={styles.legal}>By continuing you agree to Waraqah’s terms and privacy policy.</Text>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    hero: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        overflow: 'hidden',
    },
    atmosphere: {
        position: 'absolute',
        top: -100,
        left: -40,
        right: -40,
        height: 320,
        backgroundColor: colors.brandSubtle,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    brandBlock: { gap: spacing.md },
    tagline: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.brand,
        marginTop: spacing.sm,
        letterSpacing: -0.2,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        lineHeight: lineHeight.md,
        color: colors.muted,
        maxWidth: 320,
    },
    actions: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    legal: {
        marginTop: spacing.xl,
        textAlign: 'center',
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.slate400,
        lineHeight: lineHeight.xs,
    },
});
