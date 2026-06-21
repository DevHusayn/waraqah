import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Title, Subtitle } from '../components/ui';
import { colors } from '../theme/colors';

export function MoreScreen({ navigation }) {
    const { logout, isAdmin } = useAuth();

    const links = [
        { label: 'Settings', screen: 'Settings' },
        { label: 'Monthly statements', screen: 'MonthlyStatement' },
        { label: 'Upgrade to Premium', screen: 'Upgrade' },
        ...(isAdmin ? [{ label: 'Admin dashboard', screen: 'Admin' }] : []),
    ];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Title>More</Title>
            <Subtitle>Settings, billing, and account</Subtitle>
            {links.map((link) => (
                <Card key={link.screen} style={styles.item}>
                    <Button title={link.label} variant="secondary" onPress={() => navigation.navigate(link.screen)} />
                </Card>
            ))}
            <Button title="Sign out" variant="danger" onPress={logout} style={{ marginTop: 8 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    content: { padding: 16, paddingBottom: 40 },
    item: { marginBottom: 10 },
});
