import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Facebook, Instagram, Linkedin } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Card } from '../../components/ui';
import {
    APP_DESCRIPTION,
    APP_DOMAIN,
    APP_NAME,
    APP_SOCIAL_LINKS,
    APP_SUPPORT_EMAIL,
    APP_TAGLINE,
    APP_VERSION,
    APP_WEBSITE_URL,
} from '../../constants/brand';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

function XIcon({ size = 22, color = colors.brand }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
            <Path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.227-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
                fill={color}
            />
        </Svg>
    );
}

const SOCIAL_ICONS = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    x: XIcon,
};

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
                <Text style={styles.label}>Website</Text>
                <Text style={styles.link} onPress={() => Linking.openURL(APP_WEBSITE_URL)}>
                    {APP_DOMAIN}
                </Text>
                <Text style={styles.label}>Follow us</Text>                <View style={styles.socialRow}>
                    {APP_SOCIAL_LINKS.map(({ id, label, url }) => {
                        const Icon = SOCIAL_ICONS[id];
                        return (
                            <Pressable
                                key={id}
                                onPress={() => Linking.openURL(url)}
                                accessibilityRole="link"
                                accessibilityLabel={label}
                                hitSlop={8}
                                style={styles.socialButton}
                            >
                                {Icon ? <Icon size={22} color={colors.brand} /> : null}
                            </Pressable>
                        );
                    })}
                </View>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: {
        fontFamily: fontFamily.brand,
        fontSize: fontSize.lg,
        color: colors.brandDark,
    },
    tagline: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.muted, marginTop: 4 },
    version: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.slate400, marginTop: spacing.sm },
    body: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.slate600, lineHeight: 22, marginTop: spacing.lg },
    label: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.muted, textTransform: 'uppercase', marginTop: spacing.lg },
    link: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.brand, marginTop: 4 },
    socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
    socialButton: { padding: 2 },
});
