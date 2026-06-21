import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { format } from 'date-fns';
import {
    formatCurrency,
    formatInvoiceUsageLabel,
    isPremiumUser,
    getDisplayNumber,
    filterInvoicesBySearch,
    sortInvoices,
    canCreateInvoice,
} from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { Spinner } from '../components/Spinner';
import { Button, Card, EmptyState, StatusBadge, Subtitle, Title } from '../components/ui';
import { colors } from '../theme/colors';

const FILTERS = ['all', 'pending', 'paid', 'overdue', 'cancelled'];

export function InvoicesListScreen({ navigation }) {
    const { invoices, clients, loading, fetchUserData, invoiceUsage } = useInvoice();
    const { businessInfo } = useSettings();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const displayed = useMemo(() => {
        let list = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);
        list = filterInvoicesBySearch(list, search, clients);
        return sortInvoices(list, 'newest');
    }, [invoices, clients, filter, search]);

    const usageLabel = formatInvoiceUsageLabel(invoiceUsage);
    const premium = isPremiumUser(businessInfo);

    const tryCreate = () => {
        if (!canCreateInvoice(invoiceUsage)) {
            navigation.getParent()?.navigate('More', { screen: 'Upgrade' });
            return;
        }
        navigation.navigate('CreateInvoice');
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    const getClientName = (clientId) => clients.find((c) => c.id === clientId)?.name || 'Unknown';

    if (loading && !refreshing) return <Spinner />;

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Title>Invoices</Title>
                <Subtitle>Manage and track invoices</Subtitle>
                {!premium && usageLabel ? <Text style={styles.usage}>{usageLabel}</Text> : null}
                <TextInput
                    placeholder="Search invoices…"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.search}
                    placeholderTextColor={colors.slate400}
                />
                <View style={styles.filters}>
                    {FILTERS.map((f) => (
                        <Pressable
                            key={f}
                            onPress={() => setFilter(f)}
                            style={[styles.chip, filter === f && styles.chipActive]}
                        >
                            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
                        </Pressable>
                    ))}
                </View>
                <Button title="Create invoice" onPress={tryCreate} style={{ marginTop: 8 }} />
            </View>
            <FlatList
                data={displayed}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
                ListEmptyComponent={
                    <EmptyState
                        title="No invoices"
                        message="Create your first invoice to get started"
                        action={<Button title="Create invoice" onPress={tryCreate} style={{ marginTop: 12 }} />}
                    />
                }
                renderItem={({ item }) => (
                    <Pressable onPress={() => navigation.navigate('InvoiceDetail', { id: item.id })}>
                        <Card style={styles.item}>
                            <View style={styles.row}>
                                <Text style={styles.num}>{getDisplayNumber(item)}</Text>
                                <StatusBadge status={item.status} />
                            </View>
                            <Text style={styles.meta}>{getClientName(item.clientId)}</Text>
                            <Text style={styles.meta}>
                                {format(new Date(item.date), 'MMM d, yyyy')} · {formatCurrency(item.total)}
                            </Text>
                        </Card>
                    </Pressable>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    header: { padding: 16, paddingBottom: 8 },
    usage: { marginTop: 8, fontSize: 13, color: '#92400e' },
    search: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.slate200,
        borderRadius: 12,
        padding: 12,
        backgroundColor: colors.white,
        fontSize: 16,
    },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.slate100,
    },
    chipActive: { backgroundColor: colors.brand },
    chipText: { fontSize: 12, fontWeight: '600', color: colors.slate600, textTransform: 'capitalize' },
    chipTextActive: { color: colors.white },
    list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
    item: { marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    num: { fontWeight: '700', fontSize: 16, color: colors.slate900 },
    meta: { color: colors.slate500, marginTop: 4, fontSize: 13 },
});
