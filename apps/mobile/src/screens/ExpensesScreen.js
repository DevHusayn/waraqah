import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Wallet } from 'lucide-react-native';
import {
    EXPENSE_CATEGORIES,
    formatCurrency,
    formatRecurringSummary,
    getExpenseCategoryLabel,
    getRecurringFrequencyLabel,
    RECURRING_FREQUENCY_OPTIONS,
    recurringFieldsFromRecord,
    toRecurringApiFields,
} from '@waraqah/shared';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/Modal';
import { PaginationBar } from '../components/PaginationBar';
import {
    BottomSheet,
    Button,
    ChipGroup,
    EmptyState,
    FAB,
    Input,
    Label,
    ListRow,
    PageHeader,
    PageLoader,
    SearchBar,
} from '../components/ui';
import { usePagedList } from '../hooks/usePagedList';
import { apiFetch } from '../api/client';
import { buildListQuery } from '../utils/pagination';
import { colors, fontFamily, fontSize, radii, spacing, touchTarget, useTheme } from '../theme';

const FILTER_ALL = 'all';
const FILTER_RECURRING = 'recurring';

const LIST_FILTER_OPTIONS = [
    { value: FILTER_ALL, label: 'All' },
    { value: FILTER_RECURRING, label: 'Recurring' },
    ...EXPENSE_CATEGORIES.map((category) => ({
        value: category.id,
        label: category.label,
    })),
];

const EMPTY = {
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: 'rent',
    vendor: '',
    description: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringEndDate: '',
};

const mapExpense = (entry) => ({ ...entry, id: entry._id || entry.id });

export function ExpensesScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { showToast } = useToast();
    const [refreshing, setRefreshing] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [listFilter, setListFilter] = useState(FILTER_ALL);
    const sheetRef = useRef(null);
    const categorySheetRef = useRef(null);
    const frequencySheetRef = useRef(null);

    const fetcher = useCallback(
        ({ page, limit, search }) =>
            apiFetch(
                `/expenses?${buildListQuery({
                    page,
                    limit,
                    search,
                    recurring: listFilter === FILTER_RECURRING || undefined,
                    category:
                        listFilter !== FILTER_ALL && listFilter !== FILTER_RECURRING
                            ? listFilter
                            : undefined,
                })}`
            ),
        [listFilter]
    );

    const {
        page,
        setPage,
        search,
        setSearch,
        data,
        pagination,
        loading,
        refresh,
    } = usePagedList({ fetcher, extraDeps: [listFilter] });

    const expenses = data.map(mapExpense);

    const openAdd = () => {
        setEditing(null);
        setForm({ ...EMPTY, date: format(new Date(), 'yyyy-MM-dd') });
        sheetRef.current?.snapToIndex(0);
    };

    const openEdit = (expense) => {
        setEditing(expense);
        setForm({
            date: expense.date || EMPTY.date,
            amount: String(expense.amount ?? ''),
            category: expense.category || EMPTY.category,
            vendor: expense.vendor || '',
            description: expense.description || '',
            ...recurringFieldsFromRecord(expense),
        });
        sheetRef.current?.snapToIndex(0);
    };

    const closeSheet = () => sheetRef.current?.close();

    const handleSave = async () => {
        const amount = Number(form.amount);
        if (!form.date.trim()) {
            showToast('Enter the expense date.', 'error');
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            showToast('Enter an amount greater than zero.', 'error');
            return;
        }
        if (!form.category.trim()) {
            showToast('Choose a category.', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                date: form.date.trim(),
                amount,
                category: form.category.trim(),
                vendor: form.vendor.trim(),
                description: form.description.trim(),
                ...toRecurringApiFields(form),
            };
            if (editing) {
                await apiFetch(`/expenses/${editing.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                showToast('Expense updated', 'success');
            } else {
                await apiFetch('/expenses', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                showToast('Expense added', 'success');
            }
            closeSheet();
            await refresh();
        } catch (err) {
            showToast(err.message || 'Could not save expense.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await apiFetch(`/expenses/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            showToast('Expense deleted', 'success');
            await refresh();
        } catch (err) {
            showToast(err.message || 'Could not delete expense.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const handleStopRecurring = async () => {
        if (!editing) return;
        setStopping(true);
        try {
            await apiFetch(`/expenses/${editing.id}/stop-recurring`, { method: 'POST' });
            showToast('This expense will no longer repeat.', 'success');
            closeSheet();
            await refresh();
        } catch (err) {
            showToast(err.message || 'Could not stop repeating this expense.', 'error');
        } finally {
            setStopping(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    if (loading && expenses.length === 0 && !refreshing && !search) return <PageLoader />;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <FlatList
                data={expenses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />
                }
                ListHeaderComponent={
                    <View>
                        <PageHeader title="Expenses" subtitle="Rent, salaries, and running costs" />
                        <View style={styles.padX}>
                            <SearchBar
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search paid to or description…"
                            />
                            <ChipGroup
                                options={LIST_FILTER_OPTIONS}
                                value={listFilter}
                                onChange={(value) => {
                                    setListFilter(value);
                                    setPage(1);
                                }}
                            />
                        </View>
                        <View style={styles.divider} />
                    </View>
                }
                ListEmptyComponent={
                    <EmptyState
                        icon={Wallet}
                        title={search || listFilter !== FILTER_ALL ? 'No expenses found' : 'No expenses yet'}
                        message={
                            search
                                ? 'Try a different search term.'
                                : listFilter !== FILTER_ALL
                                  ? 'Try a different filter or add an expense in this group.'
                                  : 'Add rent, salaries, and other running costs.'
                        }
                        actionLabel={search || listFilter !== FILTER_ALL ? undefined : 'Add expense'}
                        onAction={search || listFilter !== FILTER_ALL ? undefined : openAdd}
                    />
                }
                ListFooterComponent={
                    <View style={styles.padX}>
                        <PaginationBar
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            onPageChange={setPage}
                            disabled={loading}
                        />
                    </View>
                }
                renderItem={({ item, index }) => (
                    <ListRow
                        title={getExpenseCategoryLabel(item.category)}
                        subtitle={[
                            item.date,
                            item.vendor,
                            item.isRecurring ? 'Recurring' : null,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                        onPress={() => openEdit(item)}
                        onLongPress={() => setDeleteId(item.id)}
                        right={
                            <Text style={styles.amount}>{formatCurrency(item.amount || 0)}</Text>
                        }
                        last={index === expenses.length - 1}
                    />
                )}
            />
            <FAB onPress={openAdd} label="Add" />

            <BottomSheet ref={sheetRef} snapPoints={['88%']} onClose={() => setForm(EMPTY)}>
                <Text style={styles.sheetTitle}>{editing ? 'Edit expense' : 'New expense'}</Text>
                <Label required>Date</Label>
                <Input
                    value={form.date}
                    onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                />
                <View style={styles.fieldGap} />
                <Label required>Amount</Label>
                <Input
                    value={form.amount}
                    onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                />
                <View style={styles.fieldGap} />
                <Label required>Category</Label>
                <Pressable
                    onPress={() => categorySheetRef.current?.expand()}
                    style={styles.selectTrigger}
                >
                    <Text style={styles.selectText}>{getExpenseCategoryLabel(form.category)}</Text>
                </Pressable>
                <View style={styles.fieldGap} />
                <Label>Paid to</Label>
                <Input
                    value={form.vendor}
                    onChangeText={(v) => setForm((f) => ({ ...f, vendor: v }))}
                    placeholder="Who was paid?"
                />
                <View style={styles.fieldGap} />
                <View style={styles.toggleRow}>
                    <Label>Repeat this expense</Label>
                    <Switch
                        value={Boolean(form.isRecurring)}
                        onValueChange={(on) => setForm((f) => ({ ...f, isRecurring: on }))}
                        trackColor={{ false: colors.slate200, true: colors.brandSecondary }}
                        thumbColor={form.isRecurring ? colors.brand : colors.slate400}
                    />
                </View>
                {form.isRecurring ? (
                    <>
                        <Label>Frequency</Label>
                        <Pressable
                            onPress={() => frequencySheetRef.current?.expand()}
                            style={styles.selectTrigger}
                        >
                            <Text style={styles.selectText}>
                                {getRecurringFrequencyLabel(form.recurringFrequency || 'monthly')}
                            </Text>
                        </Pressable>
                        <View style={styles.fieldGap} />
                        <Label>End date (optional)</Label>
                        <Input
                            value={form.recurringEndDate || ''}
                            onChangeText={(v) => setForm((f) => ({ ...f, recurringEndDate: v }))}
                            placeholder="YYYY-MM-DD"
                            autoCapitalize="none"
                        />
                        {editing?.isRecurring ? (
                            <Text style={styles.hint}>
                                {formatRecurringSummary({
                                    frequency: editing.recurringFrequency,
                                    endDate: editing.recurringEndDate,
                                    nextDate: editing.recurringNextDate,
                                })}
                            </Text>
                        ) : null}
                        <View style={styles.fieldGap} />
                    </>
                ) : null}
                <Label>Description</Label>
                <Input
                    value={form.description}
                    onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                    multiline
                    style={{ minHeight: 72, textAlignVertical: 'top' }}
                    placeholder="Optional notes"
                />
                <Button
                    title={editing ? 'Save changes' : 'Add expense'}
                    onPress={handleSave}
                    loading={saving}
                    style={{ marginTop: spacing.xxl }}
                />
                {editing?.isRecurring ? (
                    <Button
                        title="Stop repeating"
                        variant="secondary"
                        onPress={handleStopRecurring}
                        loading={stopping}
                        style={{ marginTop: spacing.sm }}
                    />
                ) : null}
                <Button title="Cancel" variant="secondary" onPress={closeSheet} style={{ marginTop: spacing.sm }} />
            </BottomSheet>

            <BottomSheet ref={categorySheetRef} snapPoints={['50%']}>
                <Text style={styles.sheetTitle}>Category</Text>
                {EXPENSE_CATEGORIES.map((category, i, arr) => (
                    <ListRow
                        key={category.id}
                        title={category.label}
                        onPress={() => {
                            setForm((f) => ({ ...f, category: category.id }));
                            categorySheetRef.current?.close();
                        }}
                        last={i === arr.length - 1}
                        dense
                    />
                ))}
            </BottomSheet>

            <BottomSheet ref={frequencySheetRef} snapPoints={['50%']}>
                <Text style={styles.sheetTitle}>How often</Text>
                {RECURRING_FREQUENCY_OPTIONS.map((opt, i, arr) => (
                    <ListRow
                        key={opt.value}
                        title={opt.label}
                        onPress={() => {
                            setForm((f) => ({ ...f, recurringFrequency: opt.value }));
                            frequencySheetRef.current?.close();
                        }}
                        last={i === arr.length - 1}
                        dense
                    />
                ))}
            </BottomSheet>

            <ConfirmModal
                visible={Boolean(deleteId)}
                title="Delete expense?"
                message="This expense will be removed from your records."
                confirmLabel="Delete"
                danger
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </SafeAreaView>
    );
}

function createStyles(colors) {
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.surface },
        list: { paddingBottom: 100, flexGrow: 1 },
        padX: { paddingHorizontal: spacing.xl, marginBottom: spacing.md },
        divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderLight },
        fieldGap: { height: spacing.lg },
        amount: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.sm,
            color: colors.foreground,
            letterSpacing: -0.2,
        },
        sheetTitle: {
            fontFamily: fontFamily.semibold,
            fontSize: fontSize.lg,
            marginBottom: spacing.xl,
            color: colors.foreground,
            letterSpacing: -0.3,
        },
        selectTrigger: {
            minHeight: touchTarget,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceMuted,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            justifyContent: 'center',
            paddingHorizontal: spacing.lg,
        },
        selectText: {
            fontFamily: fontFamily.regular,
            fontSize: fontSize.md,
            color: colors.foreground,
        },
        toggleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: touchTarget,
            marginBottom: spacing.md,
        },
        hint: {
            marginTop: spacing.sm,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.xs,
            color: colors.slate400,
        },
    });
}
