import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Building2, CreditCard, Palette, Crown, Info, FileText } from 'lucide-react-native';
import { isPremiumUser } from '@waraqah/shared';
import { useSettings } from '../../context/SettingsContext';
import { getBusinessInitials } from '@waraqah/shared';
import { AvatarInitials, ListRow, PageHeader } from '../../components/ui';
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
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <PageHeader title="Settings" subtitle="Manage your business and account" />
            <View style={styles.summary}>
                <AvatarInitials initials={initials} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{businessInfo?.name || 'Your business'}</Text>
                    <Text style={styles.plan}>{premium ? 'Premium plan' : 'Free plan'}</Text>
                </View>
            </View>
            {MENU.map((item) => {
                const Icon = item.icon;
                return (
                    <ListRow
                        key={item.screen}
                        title={item.title}
                        subtitle={item.subtitle}
                        onPress={() => navigation.navigate(item.screen)}
                        left={<Icon size={20} color={colors.brand} />}
                    />
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    summary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    name: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.md,
        color: colors.foreground,
    },
    plan: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.muted,
        marginTop: 2,
    },
});
