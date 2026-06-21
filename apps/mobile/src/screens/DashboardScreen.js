import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { format } from 'date-fns';
import { formatCurrency, formatInvoiceUsageLabel, isPremiumUser, getDisplayNumber } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { Spinner } from '../components/Spinner';
import { Card, StatusBadge, Title, Subtitle, Button } from '../components/ui';
import { colors } from '../theme/colors';
import { canCreateInvoice } from '@waraqah/shared';

export function DashboardScreen({ navigation }) {
    const { invoices, clients, invoiceUsage, loading, fetchUserData } = useInvoice();
    const { businessInfo } = useSettings();
    const [refreshing, setRefreshing] = useState(false);

    const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);
    const pendingRevenue = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + (i.total || 0), 0);
    const recent = [...invoices].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 5);
    const overdue = invoices.filter((i) => i.status === 'overdue');
    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    const tryCreate = () => {
        if (!canCreateInvoice(invoiceUsage)) {
            navigation.navigate('Upgrade');
            return;
        }
        navigation.navigate('Invoices', { screen: 'CreateInvoice' });
    };

    if (loading && !refreshing) return <Spinner />;

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        >
            <Title>Dashboard</Title>
            <Subtitle>Welcome back — here's your overview</Subtitle>
            {!premium && usageLabel ? (
                <Text style={styles.usage}>{usageLabel}</Text>
            ) : null}

            <View style={styles.statsGrid}>
                {[
                    ['Invoices', String(invoices.length)],
                    ['Clients', String(clients.length)],
                    ['Paid', formatCurrency(totalRevenue)],
                    ['Pending', formatCurrency(pendingRevenue)],
                ].map(([label, value]) => (
                    <Card key={label} style={styles.stat}>
                        <Text style={styles.statLabel}>{label}</Text>
                        <Text style={styles.statValue}>{value}</Text>
                    </Card>
                ))}
            </View>

            <Button title="Create invoice" onPress={tryCreate} style={{ marginBottom: 16 }} />

            <Text style={styles.section}>Recent invoices</Text>
            {recent.length === 0 ? (
                <Card><Text style={styles.muted}>No invoices yet</Text></Card>
            ) : (
                recent.map((inv) => (
                    <Pressable key={inv.id} onPress={() => navigation.navigate('Invoices', { screen: 'InvoiceDetail', params: { id: inv.id } })}>
                        <Card style={styles.listItem}>
                            <View style={styles.row}>
                                <Text style={styles.itemTitle}>{getDisplayNumber(inv)}</Text>
                                <StatusBadge status={inv.status} />
                            </View>
                            <Text style={styles.muted}>{format(new Date(inv.date), 'MMM d, yyyy')} · {formatCurrency(inv.total)}</Text>
                        </Card>
                    </Pressable>
                ))
            )}

            {overdue.length > 0 ? (
                <>
                    <Text style={[styles.section, { color: colors.red600 }]}>Overdue ({overdue.length})</Text>
                    {overdue.slice(0, 3).map((inv) => (
                        <Pressable key={inv.id} onPress={() => navigation.navigate('Invoices', { screen: 'InvoiceDetail', params: { id: inv.id } })}>
                            <Card style={styles.listItem}>
                                <Text style={styles.itemTitle}>{getDisplayNumber(inv)}</Text>
                                <Text style={styles.muted}>{formatCurrency(inv.total)}</Text>
                            </Card>
                        </Pressable>
                    ))}
                </>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    content: { padding: 16, paddingBottom: 32 },
    usage: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fffbeb',
        borderRadius: 10,
        color: '#92400e',
        fontSize: 13,
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 16 },
    stat: { width: '47%', flexGrow: 1 },
    statLabel: { fontSize: 13, color: colors.slate500 },
    statStatValue: {},
    statValue: { fontSize: 20, fontWeight: '700', color: colors.slate900, marginTop: 4 },
    section: { fontSize: 16, fontWeight: '700', color: colors.slate900, marginBottom: 8, marginTop: 8 },
    listItem: { marginBottom: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemTitle: { fontWeight: '700', color: colors.slate900 },
    muted: { color: colors.slate500, marginTop: 4, fontSize: 13 },
});
