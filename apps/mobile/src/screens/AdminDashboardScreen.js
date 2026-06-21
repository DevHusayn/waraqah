import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';
import { Button, Card, Title, Subtitle } from '../components/ui';
import { colors } from '../theme/colors';

export function AdminDashboardScreen() {
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await apiFetch('/auth/admin/users');
            setUsers(Array.isArray(data) ? data : data.users || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const patch = async (path, body = {}) => {
        try {
            await apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
            await load();
            showToast('Updated', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (loading && !refreshing) return <Spinner />;

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Title>Admin</Title>
                <Subtitle>Manage users and plans</Subtitle>
            </View>
            <FlatList
                data={users}
                keyExtractor={(item) => item._id || item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const id = item._id || item.id;
                    const disabled = item.status === 'suspended';
                    const plan = item.businessInfo?.plan || 'free';
                    return (
                        <Card style={styles.card}>
                            <Text style={styles.email}>{item.email}</Text>
                            <Text style={styles.meta}>
                                Plan: {plan} · {disabled ? 'Suspended' : 'Active'}
                                {item.isAdmin ? ' · Admin' : ''}
                            </Text>
                            <View style={styles.actions}>
                                <Button
                                    title={disabled ? 'Enable' : 'Suspend'}
                                    variant="secondary"
                                    onPress={() => patch(`/auth/admin/users/${id}/status`)}
                                    style={styles.btn}
                                />
                                <Button
                                    title={plan === 'premium' ? 'Set free' : 'Set premium'}
                                    variant="secondary"
                                    onPress={() =>
                                        patch(`/auth/admin/users/${id}/plan`, {
                                            plan: plan === 'premium' ? 'free' : 'premium',
                                        })
                                    }
                                    style={styles.btn}
                                />
                            </View>
                            <View style={styles.actions}>
                                <Button title="Reset usage" variant="secondary" onPress={() => patch(`/auth/admin/users/${id}/invoice-usage/reset`)} style={styles.btn} />
                                <Button title="Unlock" variant="secondary" onPress={() => patch(`/auth/admin/users/${id}/unlock`)} style={styles.btn} />
                            </View>
                        </Card>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.slate50 },
    header: { padding: 16, paddingBottom: 8 },
    list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
    card: { marginBottom: 10 },
    email: { fontWeight: '700', fontSize: 15, color: colors.slate900 },
    meta: { color: colors.slate500, marginTop: 4, marginBottom: 10, fontSize: 13 },
    actions: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    btn: { flex: 1 },
});
