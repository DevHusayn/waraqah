import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building2, CreditCard, Palette, Crown, Info, FileText } from 'lucide-react-native';
import { getBusinessInitials, isPremiumUser } from '@waraqah/shared';
import { useSettings } from '../../context/SettingsContext';
import { AvatarInitials, ListRow } from '../../components/ui';
import { colors, fontFamily, fontSize, spacing } from '../../theme';

const MENU = [
    { screen: 'CompanyProfile', title: 'Company profile', subtitle: 'Business name, address, contact', icon: Building2 },
    { screen: 'AccountDetails', title: 'Account details', subtitle: 'Bank details for payments', icon: CreditCard },
    { screen: 'Branding', title: 'Branding', subtitle: 'Logo, color, stamp', icon: Palette },
    { screen: 'PlanBilling', title: 'Plan & billing', subtitle: 'Subscription and usage', icon: Crown },
    { screen: 'About', title: 'About', subtitle: 'App info and support', icon: Info },
    { screen: 'Terms', title: 'Terms', subtitle: 'Terms of service', icon: FileText },
];

export function SettingsIndexScreen({ navigation }) {
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const initials = getBusinessInitials(businessInfo?.name || 'W');

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
                {MENU.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <ListRow
                            key={item.screen}
                            title={item.title}
                            subtitle={item.subtitle}
                            onPress={() => navigation.navigate(item.screen)}
                            left={<Icon size={20} color={colors.slate600} strokeWidth={2} />}
                            last={index === MENU.length - 1}
                            dense
                        />
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
