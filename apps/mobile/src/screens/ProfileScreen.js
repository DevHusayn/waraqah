import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Settings,
    FileBarChart,
    Crown,
    LogOut,
    Shield,
    Bell,
    Moon,
    HelpCircle,
} from 'lucide-react-native';
import { getBusinessInitials, isPremiumUser } from '@waraqah/shared';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useAppStore } from '../stores/appStore';
import { AvatarInitials, ListRow } from '../components/ui';
import { APP_SUPPORT_EMAIL, APP_VERSION } from '../constants/brand';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing } from '../theme';

export function ProfileScreen({ navigation }) {
    const { logout, isAdmin, user } = useAuth();
    const { businessInfo } = useSettings();
    const themeMode = useAppStore((s) => s.themeMode);
    const setThemeMode = useAppStore((s) => s.setThemeMode);
    const premium = isPremiumUser(businessInfo);
    const businessName = businessInfo?.name || 'Your business';
    const displayName = user?.name || businessName;

    const cycleTheme = () => {
        const order = ['system', 'light', 'dark'];
        const next = order[(order.indexOf(themeMode) + 1) % order.length];
        setThemeMode(next);
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>Profile</Text>

                <View style={styles.hero}>
                    <AvatarInitials initials={getBusinessInitials(displayName)} size={64} />
                    <View style={styles.heroText}>
                        <Text style={styles.name}>{displayName}</Text>
                        <Text style={styles.email}>{user?.email || businessInfo?.email || ''}</Text>
                        <View style={[styles.planPill, premium ? styles.planPremium : styles.planFree]}>
                            <Text style={[styles.planText, premium && styles.planTextPremium]}>
                                {premium ? 'Premium' : 'Free plan'}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.section}>Business</Text>
                <View style={styles.group}>
                    <ListRow
                        title="Settings"
                        subtitle="Profile, branding, billing"
                        onPress={() => navigation.navigate('Settings')}
                        left={<Settings size={20} color={colors.slate600} strokeWidth={2} />}
                        dense
                    />
                    <ListRow
                        title="Statements"
                        subtitle="Monthly income & trends"
                        onPress={() => navigation.navigate('MonthlyStatement')}
                        left={<FileBarChart size={20} color={colors.slate600} strokeWidth={2} />}
                        dense
                    />
                    {!premium ? (
                        <ListRow
                            title="Upgrade to Premium"
                            subtitle="Unlimited invoices & branding"
                            onPress={() => navigation.navigate('Upgrade')}
                            left={<Crown size={20} color={colors.amber600} strokeWidth={2} />}
                            last
                            dense
                        />
                    ) : (
                        <View style={styles.lastSpacer} />
                    )}
                </View>

                <Text style={styles.section}>Preferences</Text>
                <View style={styles.group}>
                    <ListRow
                        title="Appearance"
                        subtitle={`Theme: ${themeMode}`}
                        onPress={cycleTheme}
                        left={<Moon size={20} color={colors.slate600} strokeWidth={2} />}
                        showChevron={false}
                        right={<Text style={styles.value}>{themeMode}</Text>}
                        dense
                    />
                    <ListRow
                        title="Notifications"
                        subtitle="Payment alerts & reminders"
                        onPress={() => navigation.navigate('Settings')}
                        left={<Bell size={20} color={colors.slate600} strokeWidth={2} />}
                        last
                        dense
                    />
                </View>

                <Text style={styles.section}>Support</Text>
                <View style={styles.group}>
                    <ListRow
                        title="Help & support"
                        subtitle={APP_SUPPORT_EMAIL}
                        onPress={() => {}}
                        left={<HelpCircle size={20} color={colors.slate600} strokeWidth={2} />}
                        showChevron={false}
                        dense
                        last={!isAdmin}
                    />
                    {isAdmin ? (
                        <ListRow
                            title="Admin dashboard"
                            subtitle="Platform overview"
                            onPress={() => navigation.navigate('Admin')}
                            left={<Shield size={20} color={colors.slate600} strokeWidth={2} />}
                            last
                            dense
                        />
                    ) : null}
                </View>

                <View style={[styles.group, { marginTop: spacing.xl }]}>
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
    content: { paddingBottom: spacing.huge },
    pageTitle: {
        fontFamily: fontFamily.bold,
        fontSize: 30,
        color: colors.foreground,
        letterSpacing: -0.8,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        marginBottom: spacing.xl,
    },
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    heroText: { flex: 1, minWidth: 0 },
    name: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        letterSpacing: -0.3,
    },
    email: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginTop: 2,
        lineHeight: lineHeight.sm,
    },
    planPill: {
        alignSelf: 'flex-start',
        marginTop: spacing.sm,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.full,
    },
    planFree: { backgroundColor: colors.slate100 },
    planPremium: { backgroundColor: colors.amber50 },
    planText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.slate600,
    },
    planTextPremium: { color: colors.amber600 },
    section: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
        fontFamily: fontFamily.semibold,
        fontSize: 12,
        color: colors.slate400,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    group: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
        backgroundColor: colors.surface,
    },
    lastSpacer: { height: 0 },
    value: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.muted,
        textTransform: 'capitalize',
    },
    version: {
        marginTop: spacing.xxl,
        textAlign: 'center',
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.slate400,
    },
});
