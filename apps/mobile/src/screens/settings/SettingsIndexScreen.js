import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building2, CreditCard, Palette, Crown, Info, FileText, Shield, Lock } from 'lucide-react-native';
import { getBusinessInitials, isPremiumUser } from '@waraqah/shared';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { AvatarInitials, ListRow } from '../../components/ui';
import { colors, fontFamily, fontSize, spacing , useTheme } from '../../theme';

const MENU = [
    { screen: 'CompanyProfile', title: 'Company profile', subtitle: 'Business name, address, contact', icon: Building2 },
    { screen: 'AccountDetails', title: 'Account details', subtitle: 'Bank details for payments', icon: CreditCard },
    { screen: 'Branding', title: 'Branding', subtitle: 'Logo, color, PDF footer', icon: Palette },
    { screen: 'PlanBilling', title: 'Plan & billing', subtitle: 'Subscription and usage', icon: Crown },
    { screen: 'Password', title: 'Password', subtitle: 'Change your sign-in password', icon: Lock, hideForGoogle: true },
    { screen: 'Terms', title: 'Terms', subtitle: 'Terms of service', icon: FileText },
    { screen: 'Privacy', title: 'Privacy', subtitle: 'How we use your data', icon: Shield },
    { screen: 'About', title: 'About', subtitle: 'App info and support', icon: Info },
];

export function SettingsIndexScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { user } = useAuth();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const initials = getBusinessInitials(businessInfo?.name || 'W');
    const usesGoogle = (user?.authProvider || 'local') === 'google';
    const items = MENU.filter((item) => !(item.hideForGoogle && usesGoogle));

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.summary}>
                <AvatarInitials initials={initials} size={52} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{businessInfo?.name || 'Your business'}</Text>
                    <Text style={styles.plan}>{premium ? 'Premium plan' : 'Free plan'}</Text>
                </View>
            </View>

            <View style={styles.group}>
                {items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <ListRow
                            key={item.screen}
                            title={item.title}
                            subtitle={item.subtitle}
                            onPress={() => navigation.navigate(item.screen)}
                            left={<Icon size={20} color={colors.slate600} strokeWidth={2} />}
                            last={index === items.length - 1}
                            dense
                        />
                    );
                })}
            </View>
        </ScrollView>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surface },
    content: { paddingBottom: spacing.huge, paddingTop: spacing.lg },
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xxl,
    },
    name: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        letterSpacing: -0.3,
    },
    plan: {
        marginTop: 2,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
    },
    group: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
});
}
