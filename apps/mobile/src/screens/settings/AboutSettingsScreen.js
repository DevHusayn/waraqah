import { Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { Card } from '../../components/ui';
import { APP_DESCRIPTION, APP_NAME, APP_SUPPORT_EMAIL, APP_TAGLINE, APP_VERSION } from '../../constants/brand';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

export function AboutSettingsScreen() {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Card elevated>
                <Text style={styles.title}>{APP_NAME}</Text>
                <Text style={styles.tagline}>{APP_TAGLINE}</Text>
                <Text style={styles.version}>Version {APP_VERSION}</Text>
                <Text style={styles.body}>{APP_DESCRIPTION}</Text>
                <Text style={styles.label}>Support</Text>
                <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${APP_SUPPORT_EMAIL}`)}>
                    {APP_SUPPORT_EMAIL}
                </Text>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: colors.foreground },
    tagline: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted, marginTop: 4 },
    version: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.slate400, marginTop: spacing.sm },
    body: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.slate600, lineHeight: 22, marginTop: spacing.lg },
    label: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.muted, textTransform: 'uppercase', marginTop: spacing.lg },
    link: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.brand, marginTop: 4 },
});
