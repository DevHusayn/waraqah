import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { Card } from '../../components/ui';
import { APP_NAME, APP_SUPPORT_EMAIL, APP_WEBSITE_URL } from '../../constants/brand';
import { isAiDraftsEnabled } from '@waraqah/shared';
import { colors, fontFamily, fontSize, spacing, useTheme } from '../../theme';

export function PrivacySettingsScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const privacyUrl = `${APP_WEBSITE_URL}/privacy`;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Card elevated>
                <Text style={styles.title}>Privacy</Text>
                <Text style={styles.body}>
                    {APP_NAME} stores your business, client, and document data to provide invoicing. We do not sell
                    your information. Payment is processed by Paystack; email is sent through Resend.
                </Text>
                {isAiDraftsEnabled() ? (
                    <Text style={[styles.body, { marginTop: spacing.md }]}>
                        If you use Premium document drafting, your prompt and a limited slice of your own client and
                        product catalog are sent to a third-party language-model provider so we can prefill an invoice
                        or quotation form. Nothing is saved or sent until you review it. You can keep creating documents
                        without this feature.
                    </Text>
                ) : null}
                <Text style={[styles.link, { marginTop: spacing.md }]} onPress={() => Linking.openURL(privacyUrl)}>
                    Full privacy policy
                </Text>
                <Text style={[styles.body, { marginTop: spacing.md }]}>
                    For privacy questions, contact {APP_SUPPORT_EMAIL}.
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
        link: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.brand },
    });
}
