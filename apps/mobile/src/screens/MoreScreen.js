import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Settings,
    FileBarChart,
    Crown,
    Package,
    LogOut,
    Shield,
    UserRound,
    ClipboardList,
} from 'lucide-react-native';
import { getBusinessInitials, isPremiumUser } from '@waraqah/shared';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { AvatarInitials, ListRow } from '../components/ui';
import { APP_VERSION } from '../constants/brand';
import { colors, fontFamily, fontSize, radii, shadows, spacing } from '../theme';

export function MoreScreen({ navigation }) {
    const { logout, isAdmin, user } = useAuth();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const name = user?.name || businessInfo?.name || 'Your account';

    const links = [
        { label: 'Profile', subtitle: 'Account overview', screen: 'ProfileHome', icon: UserRound },
        { label: 'Settings', subtitle: 'Business, branding, billing', screen: 'Settings', icon: Settings },
        { label: 'Quotations', subtitle: 'Estimates and proposals', screen: 'Quotations', icon: ClipboardList },
        { label: 'Products', subtitle: 'Product catalog', screen: 'Products', icon: Package },
        { label: 'Statements', subtitle: 'Monthly income & trends', screen: 'MonthlyStatement', icon: FileBarChart },
        { label: 'Upgrade to Premium', subtitle: 'Unlimited invoices & branding', screen: 'Upgrade', icon: Crown },
        ...(isAdmin ? [{ label: 'Admin', subtitle: 'Platform overview', screen: 'Admin', icon: Shield }] : []),
    ];

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>More</Text>

                <View style={[styles.hero, shadows.soft]}>
                    <AvatarInitials initials={getBusinessInitials(name)} size={52} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.email}>{user?.email || businessInfo?.email || ''}</Text>
                        <View style={[styles.pill, premium ? styles.pillPremium : styles.pillFree]}>
                            <Text style={[styles.pillText, premium && styles.pillTextPremium]}>
                                {premium ? 'Premium' : 'Free plan'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.group, shadows.soft]}>
                    {links.map((link, index) => {
                        const Icon = link.icon;
                        return (
                            <ListRow
                                key={link.screen}
                                title={link.label}
                                subtitle={link.subtitle}
                                onPress={() => navigation.navigate(link.screen)}
                                left={<Icon size={20} color={link.screen === 'Upgrade' ? colors.amber600 : colors.slate600} strokeWidth={2} />}
                                last={index === links.length - 1}
                                dense
                            />
                        );
                    })}
                </View>

                <View style={[styles.group, shadows.soft, { marginTop: spacing.lg }]}>
                    <ListRow
                        title="Sign out"
                        onPress={logout}
                        left={<LogOut size={20} color={colors.red600} strokeWidth={2} />}
                        showChevron={false}
                        last
                        dense
                    />
                </View>

                <Text style={styles.version}>Waraqah v{APP_VERSION}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { paddingBottom: spacing.huge, paddingTop: spacing.lg },
    pageTitle: {
        fontFamily: fontFamily.bold,
        fontSize: 30,
        color: colors.foreground,
        letterSpacing: -0.8,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.xl,
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    name: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
    },
    email: {
        marginTop: 2,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
    },
    pill: {
        alignSelf: 'flex-start',
        marginTop: spacing.sm,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.full,
    },
    pillFree: { backgroundColor: colors.slate100 },
    pillPremium: { backgroundColor: colors.amber50 },
    pillText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.slate600,
    },
    pillTextPremium: { color: colors.amber600 },
    group: {
        marginHorizontal: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    version: {
        marginTop: spacing.xxl,
        textAlign: 'center',
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.slate400,
    },
});
