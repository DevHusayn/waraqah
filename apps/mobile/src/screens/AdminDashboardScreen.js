import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';
import { PaginationBar } from '../components/PaginationBar';
import { Button, Card, Title, Subtitle, SearchBar } from '../components/ui';
import { usePagedList } from '../hooks/usePagedList';
import { buildListQuery } from '../utils/pagination';
import { colors } from '../theme/colors';
import { spacing } from '../theme';

export function AdminDashboardScreen() {
    const { showToast } = useToast();
    const [refreshing, setRefreshing] = useState(false);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(`/auth/admin/users?${buildListQuery({ page, limit, search })}`),
        []
    );

    const {
        setPage,
        search,
        setSearch,
        data: users,
        pagination,
        loading,
        refresh,
    } = usePagedList({ fetcher });

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    const patch = async (path, body = {}) => {
        try {
            await apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
            await refresh();
            showToast('Updated', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (loading && !refreshing && users.length === 0) return <Spinner />;

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Title>Admin</Title>
                <Subtitle>Manage users and plans</Subtitle>
                <SearchBar
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search users…"
                    style={{ marginTop: spacing.md }}
                />
            </View>
            <FlatList
                data={users}
                keyExtractor={(item) => item._id || item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                contentContainerStyle={styles.list}
                ListFooterComponent={
                    <PaginationBar
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        total={pagination.total}
                        onPageChange={setPage}
                        disabled={loading}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>{search ? 'No users match your search' : 'No users yet'}</Text>
                }
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
                                <Button
                                    title="Reset usage"
                                    variant="secondary"
                                    onPress={() => patch(`/auth/admin/users/${id}/invoice-usage/reset`)}
                                    style={styles.btn}
                                />
                                <Button
                                    title="Unlock"
                                    variant="secondary"
                                    onPress={() => patch(`/auth/admin/users/${id}/unlock`)}
                                    style={styles.btn}
                                />
                            </View>
                        </Card>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.surfaceMuted || '#f4f4f5' },
    header: { padding: 16, paddingBottom: 8 },
    list: { padding: 16, paddingTop: 8, paddingBottom: 40 },
    card: { marginBottom: 12 },
    email: { fontWeight: '600', marginBottom: 4, color: colors.foreground },
    meta: { color: colors.muted, marginBottom: 12, fontSize: 13 },
    actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    btn: { flex: 1 },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
