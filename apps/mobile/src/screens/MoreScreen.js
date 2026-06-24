import { ScrollView, StyleSheet } from 'react-native';
import {
    Settings,
    FileBarChart,
    Crown,
    Package,
    LogOut,
    Shield,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { ListRow, PageHeader } from '../components/ui';
import { colors, spacing } from '../theme';

export function MoreScreen({ navigation }) {
    const { logout, isAdmin } = useAuth();

    const links = [
        { label: 'Settings', subtitle: 'Business, branding, billing', screen: 'Settings', icon: Settings },
        { label: 'Products', subtitle: 'Product catalog', screen: 'Products', icon: Package },
        { label: 'Monthly statements', subtitle: 'Export period summaries', screen: 'MonthlyStatement', icon: FileBarChart },
        { label: 'Upgrade to Premium', subtitle: 'Unlimited invoices & branding', screen: 'Upgrade', icon: Crown },
        ...(isAdmin ? [{ label: 'Admin dashboard', subtitle: 'Platform overview', screen: 'Admin', icon: Shield }] : []),
    ];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <PageHeader title="More" subtitle="Settings, billing, and account" />
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <ListRow
                        key={link.screen}
                        title={link.label}
                        subtitle={link.subtitle}
                        onPress={() => navigation.navigate(link.screen)}
                        left={<Icon size={20} color={colors.brand} />}
                    />
                );
            })}
            <ListRow
                title="Sign out"
                subtitle="Log out of your account"
                onPress={logout}
                left={<LogOut size={20} color={colors.red600} />}
                showChevron={false}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
