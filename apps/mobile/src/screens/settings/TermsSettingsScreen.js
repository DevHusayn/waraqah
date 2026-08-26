import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Card } from '../../components/ui';
import { APP_NAME, APP_SUPPORT_EMAIL } from '../../constants/brand';
import { colors, fontFamily, fontSize, spacing , useTheme } from '../../theme';

export function TermsSettingsScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Card elevated>
                <Text style={styles.title}>Terms of service</Text>
                <Text style={styles.body}>
                    By using {APP_NAME}, you agree to use the service responsibly for legitimate business invoicing.
                    Invoice data is stored securely and used only to provide the invoicing service. You retain ownership
                    of your business data. Premium subscriptions renew monthly until cancelled.
                </Text>
                <Text style={[styles.body, { marginTop: spacing.md }]}>
                    For full terms or questions, contact {APP_SUPPORT_EMAIL}.
                </Text>
            </Card>
        </ScrollView>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.foreground, marginBottom: spacing.md },
    body: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.slate600, lineHeight: 22 },
});
}
