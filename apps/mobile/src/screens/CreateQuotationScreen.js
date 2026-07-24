import { useEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ChevronDown, Trash2 } from 'lucide-react-native';
import {
    APP_CURRENCY,
    buildUnitSelectOptions,
    calculateInvoiceTotals,
    CUSTOM_UNIT_OPTION,
    DEFAULT_INVOICE_UNIT,
    DEFAULT_QUOTATION_TERMS,
    formatCurrency,
    getClientBusiness,
    normalizeCurrency,
    normalizeInvoiceUnit,
    SUPPORTED_CURRENCIES,
} from '@waraqah/shared';
import { apiFetch } from '../api/client';
import { useQuotation } from '../context/QuotationContext';
import { useInvoice } from '../context/InvoiceContext';
import { useToast } from '../context/ToastContext';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';
import {
    BottomSheet,
    Button,
    FieldError,
    Input,
    Label,
    ListRow,
    PageLoader,
} from '../components/ui';
import { useQuotationCreateGuard } from '../hooks/useQuotationCreateGuard';
import { ensureInvoiceClient } from '../utils/ensureInvoiceClient';
import {
    buildQuotationDraftFieldErrors,
    buildQuotationFieldErrors,
} from '../utils/quotationFormValidation';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing, touchTarget } from '../theme';

const emptyItem = () => ({
    description: '',
    quantity: '1',
    rate: '0',
    unit: DEFAULT_INVOICE_UNIT,
});

function buildPayload(form, status) {
    const items = form.items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        rate: Number(it.rate),
        unit: normalizeInvoiceUnit(it.unit),
    }));
    const totals = calculateInvoiceTotals(items, {
        taxRate: form.taxRate,
        discountType: 'percent',
        discountValue: form.discountValue || 0,
    });

    return {
        clientId: form.clientId || null,
        date: form.date,
        validUntil: form.hasValidUntil ? form.validUntil : null,
        items,
        notes: form.notes || '',
        terms: form.terms ?? DEFAULT_QUOTATION_TERMS,
        status,
        currency: normalizeCurrency(form.currency || APP_CURRENCY),
        taxRate: Number(form.taxRate) || 0,
        discountType: 'percent',
        discountValue: Number(form.discountValue) || 0,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
    };
}

export function CreateQuotationScreen({ route, navigation }) {
    const editId = route.params?.id;
    const insets = useSafeAreaInsets();
    const { quotations, addQuotation, updateQuotation, upsertQuotation } = useQuotation();
    const { clients, products, addClient, updateClient, fetchProducts } = useInvoice();
    const { showToast } = useToast();
    const limitModalRef = useRef(null);
    const clientSheetRef = useRef(null);
    const productSheetRef = useRef(null);
    const unitSheetRef = useRef(null);
    const currencySheetRef = useRef(null);
    const [unitSheetIndex, setUnitSheetIndex] = useState(null);
    const [customUnitIndex, setCustomUnitIndex] = useState(null);
    const [customUnitValue, setCustomUnitValue] = useState('');
    const [resolving, setResolving] = useState(Boolean(editId));
    const { invoiceUsage, tryCreate, goUpgrade } = useQuotationCreateGuard(limitModalRef, navigation);

    const existing = useMemo(() => {
        if (!editId) return null;
        return quotations.find((q) => q.id === editId) || null;
    }, [editId, quotations]);

    useEffect(() => {
        if (!editId) {
            setResolving(false);
            return undefined;
        }
        if (existing) {
            setResolving(false);
            return undefined;
        }
        let cancelled = false;
        setResolving(true);
        apiFetch(`/quotations/${editId}`)
            .then((data) => {
                if (!cancelled) upsertQuotation({ ...data, id: data._id || data.id });
            })
            .catch(() => {
                if (!cancelled) {
                    showToast('Quotation not found', 'error');
                    navigation.goBack();
                }
            })
            .finally(() => {
                if (!cancelled) setResolving(false);
            });
        return () => {
            cancelled = true;
        };
    }, [editId, existing, upsertQuotation, showToast, navigation]);

    const isDraftFlow = !editId || existing?.status === 'draft';
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState({
        quotationNumber: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        validUntil: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
        hasValidUntil: true,
        items: [emptyItem()],
        notes: '',
        terms: DEFAULT_QUOTATION_TERMS,
        currency: APP_CURRENCY,
        taxRate: '0',
        discountValue: '',
    });

    useEffect(() => {
        fetchProducts().catch(() => {});
    }, [fetchProducts]);

    useEffect(() => {
        if (!editId || !existing) return;
        if (['converted', 'expired'].includes(existing.status)) {
            navigation.replace('QuotationDetail', { id: editId });
            return;
        }
        const linked = clients.find((c) => c.id === existing.clientId);
        setForm({
            quotationNumber: existing.quotationNumber || '',
            clientId: existing.clientId || '',
            clientName: linked?.name || '',
            clientEmail: linked?.email || '',
            date: existing.date
                ? format(new Date(existing.date), 'yyyy-MM-dd')
                : format(new Date(), 'yyyy-MM-dd'),
            validUntil: existing.validUntil
                ? format(new Date(existing.validUntil), 'yyyy-MM-dd')
                : format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
            hasValidUntil: Boolean(existing.validUntil),
            items:
                (existing.items || []).length > 0
                    ? existing.items.map((it) => ({
                          description: it.description || '',
                          quantity: String(it.quantity ?? 1),
                          rate: String(it.rate ?? 0),
                          unit: normalizeInvoiceUnit(it.unit),
                      }))
                    : [emptyItem()],
            notes: existing.notes || '',
            terms: existing.terms || DEFAULT_QUOTATION_TERMS,
            currency: normalizeCurrency(existing.currency || APP_CURRENCY),
            taxRate: String(existing.taxRate ?? 0),
            discountValue:
                existing.discountValue != null && existing.discountValue !== ''
                    ? String(existing.discountValue)
                    : '',
        });
    }, [editId, existing, clients, navigation]);

    const clearError = (key) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const setField = (name, value) => {
        setForm((f) => ({ ...f, [name]: value }));
        clearError(name);
    };

    const handleClientNameChange = (value) => {
        setForm((prev) => {
            const next = { ...prev, clientName: value };
            if (prev.clientId) {
                const linked = clients.find((c) => c.id === prev.clientId);
                if (linked && linked.name !== value) {
                    next.clientId = '';
                }
            }
            return next;
        });
        clearError('clientName');
        clearError('clientId');
    };

    const handleSelectSavedClient = (client) => {
        if (!client) return;
        setForm((prev) => ({
            ...prev,
            clientId: client.id,
            clientName: client.name || '',
            clientEmail: client.email || '',
        }));
        clearError('clientName');
        clearError('clientId');
        clearError('clientEmail');
        clientSheetRef.current?.close();
    };

    const setItem = (index, key, value) => {
        setForm((f) => {
            const items = [...f.items];
            items[index] = { ...items[index], [key]: value };
            return { ...f, items };
        });
        clearError(`item-${index}-${key}`);
    };

    const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
    const removeItem = (index) =>
        setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

    const addProductAsItem = (product) => {
        const rate = String(product.unitPrice ?? product.price ?? 0);
        setForm((f) => {
            const items = [...f.items];
            const emptyIndex = items.findIndex((it) => !it.description.trim());
            const nextItem = {
                description: product.name,
                quantity: '1',
                rate,
                unit: DEFAULT_INVOICE_UNIT,
            };
            if (emptyIndex >= 0) {
                items[emptyIndex] = nextItem;
            } else {
                items.push(nextItem);
            }
            return { ...f, items };
        });
        productSheetRef.current?.close();
        showToast(`Added ${product.name}`, 'success');
    };

    const validationShape = () => ({
        ...form,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientId: form.clientId,
        taxRate: form.taxRate,
        discountType: 'percent',
        discountValue: form.discountValue,
        items: form.items,
        hasValidUntil: form.hasValidUntil,
        validUntil: form.hasValidUntil ? form.validUntil : null,
    });

    const persist = async (asDraft = false) => {
        if (!asDraft && !editId && !tryCreate(() => {})) return;

        const shape = validationShape();
        const errors = asDraft
            ? buildQuotationDraftFieldErrors(shape)
            : buildQuotationFieldErrors(shape);
        setFieldErrors(errors);
        if (Object.values(errors).some(Boolean)) {
            showToast('Please fix the highlighted fields', 'error');
            return;
        }

        setSaving(true);
        try {
            let clientId = form.clientId || null;
            if (form.clientName.trim() || form.clientId) {
                clientId = await ensureInvoiceClient(
                    {
                        clientId: form.clientId,
                        clientName: form.clientName,
                        clientEmail: form.clientEmail,
                    },
                    clients,
                    { addClient, updateClient }
                );
            }

            const status = asDraft
                ? 'draft'
                : existing && existing.status !== 'draft'
                  ? existing.status
                  : 'sent';

            const payload = {
                ...buildPayload({ ...form, clientId }, status),
                clientId: clientId || null,
            };

            if (editId) {
                await updateQuotation(editId, payload);
                showToast(asDraft ? 'Draft saved' : 'Quotation updated', 'success');
            } else {
                await addQuotation(payload);
                showToast(asDraft ? 'Draft saved' : 'Quotation created', 'success');
            }
            navigation.goBack();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const totals = calculateInvoiceTotals(
        form.items.map((it) => ({
            description: it.description,
            quantity: Number(it.quantity),
            rate: Number(it.rate),
            unit: normalizeInvoiceUnit(it.unit),
        })),
        {
            taxRate: form.taxRate,
            discountType: 'percent',
            discountValue: form.discountValue || 0,
        }
    );

    const openUnitSheet = (index) => {
        setUnitSheetIndex(index);
        unitSheetRef.current?.expand();
    };

    const handleCurrencySelect = (code) => {
        setField('currency', normalizeCurrency(code));
        currencySheetRef.current?.close();
    };

    const handleUnitOptionSelect = (value) => {
        if (unitSheetIndex == null) return;
        unitSheetRef.current?.close();
        if (value === CUSTOM_UNIT_OPTION) {
            setCustomUnitValue('');
            setCustomUnitIndex(unitSheetIndex);
            return;
        }
        setItem(unitSheetIndex, 'unit', value);
    };

    const saveCustomUnit = () => {
        const trimmed = customUnitValue.trim();
        if (!trimmed || customUnitIndex == null) return;
        setItem(customUnitIndex, 'unit', trimmed);
        setCustomUnitIndex(null);
        setCustomUnitValue('');
    };

    const quotationNumberDisplay = isDraftFlow
        ? form.quotationNumber || 'Assigned when sent'
        : form.quotationNumber || '—';

    const title = !editId ? 'Create quotation' : isDraftFlow ? 'Complete quotation' : 'Edit quotation';
    const primaryLabel = !editId || isDraftFlow ? 'Create quotation' : 'Save changes';
    const unitSheetOptions =
        unitSheetIndex != null
            ? buildUnitSelectOptions(form.items[unitSheetIndex]?.unit)
            : buildUnitSelectOptions(DEFAULT_INVOICE_UNIT);

    if (editId && (resolving || !existing)) return <PageLoader />;

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={88}
        >
            <ScrollView
                style={styles.screen}
                contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.pageTitle}>{title}</Text>
                <Text style={styles.pageSub}>
                    {isDraftFlow ? 'Fill in the details below' : 'Update details before sending'}
                </Text>

                <Text style={styles.section}>Quotation details</Text>
                <View style={styles.fieldBlock}>
                    <Label>Quotation number</Label>
                    <Input
                        value={quotationNumberDisplay}
                        editable={false}
                        selectTextOnFocus={false}
                        style={styles.readonlyInput}
                    />
                </View>
                <View style={styles.fieldBlock}>
                    <Label required>Tax rate (%)</Label>
                    <Input
                        value={form.taxRate}
                        onChangeText={(v) => setField('taxRate', v)}
                        keyboardType="decimal-pad"
                        error={Boolean(fieldErrors.taxRate)}
                        placeholder="0"
                    />
                    <FieldError message={fieldErrors.taxRate} />
                </View>
                <View style={styles.fieldBlock}>
                    <Label>Discount (%)</Label>
                    <Input
                        value={form.discountValue}
                        onChangeText={(v) => setField('discountValue', v)}
                        keyboardType="decimal-pad"
                        error={Boolean(fieldErrors.discountValue)}
                        placeholder="0"
                    />
                    <FieldError message={fieldErrors.discountValue} />
                </View>
                <View style={styles.fieldBlock}>
                    <Label required>Issue date</Label>
                    <Input
                        value={form.date}
                        onChangeText={(v) => setField('date', v)}
                        error={Boolean(fieldErrors.date)}
                        placeholder="YYYY-MM-DD"
                        autoCapitalize="none"
                    />
                    <FieldError message={fieldErrors.date} />
                </View>
                <View style={styles.fieldBlock}>
                    <View style={styles.dueToggleRow}>
                        <Label>Valid until</Label>
                        <Switch
                            value={form.hasValidUntil}
                            onValueChange={(on) => setField('hasValidUntil', on)}
                            trackColor={{ false: colors.slate200, true: colors.brandSecondary }}
                            thumbColor={form.hasValidUntil ? colors.brand : colors.slate400}
                            accessibilityLabel="Include valid until date"
                        />
                    </View>
                    {form.hasValidUntil ? (
                        <>
                            <Input
                                value={form.validUntil}
                                onChangeText={(v) => setField('validUntil', v)}
                                error={Boolean(fieldErrors.validUntil)}
                                placeholder="YYYY-MM-DD"
                                autoCapitalize="none"
                            />
                            <FieldError message={fieldErrors.validUntil} />
                        </>
                    ) : (
                        <Text style={styles.hint}>No expiry date will appear on this quotation.</Text>
                    )}
                </View>

                <Text style={styles.section}>Client</Text>
                <View style={styles.fieldBlock}>
                    <Label required>Client name</Label>
                    <Input
                        value={form.clientName}
                        onChangeText={handleClientNameChange}
                        error={Boolean(fieldErrors.clientName || fieldErrors.clientId)}
                        placeholder="John Doe"
                        autoCapitalize="words"
                    />
                    <FieldError message={fieldErrors.clientName || fieldErrors.clientId} />
                </View>
                <View style={styles.fieldBlock}>
                    <Label>Email (optional)</Label>
                    <Input
                        value={form.clientEmail}
                        onChangeText={(v) => setField('clientEmail', v)}
                        error={Boolean(fieldErrors.clientEmail)}
                        placeholder="client@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <FieldError message={fieldErrors.clientEmail} />
                    <Text style={styles.hint}>Add an email to send this quotation to your client.</Text>
                </View>
                {clients.length > 0 ? (
                    <View style={styles.fieldBlock}>
                        <Label>Fill from saved client</Label>
                        <Pressable
                            onPress={() => clientSheetRef.current?.snapToIndex(0)}
                            style={styles.selectTrigger}
                            accessibilityRole="button"
                            accessibilityLabel="Choose a saved client"
                        >
                            <Text
                                style={[
                                    styles.selectText,
                                    !form.clientId && styles.selectPlaceholder,
                                ]}
                                numberOfLines={1}
                            >
                                {form.clientId
                                    ? (() => {
                                          const c = clients.find((x) => x.id === form.clientId);
                                          if (!c) return 'Choose a saved client';
                                          const biz = getClientBusiness(c);
                                          return biz ? `${c.name} — ${biz}` : c.name;
                                      })()
                                    : 'Choose a saved client'}
                            </Text>
                            <ChevronDown size={18} color={colors.slate400} strokeWidth={2} />
                        </Pressable>
                    </View>
                ) : null}

                <View style={styles.itemsHeader}>
                    <Text style={[styles.section, { marginBottom: 0, paddingHorizontal: 0 }]}>Items</Text>
                    <View style={styles.itemsActions}>
                        {products.length > 0 ? (
                            <Pressable onPress={() => productSheetRef.current?.snapToIndex(0)} hitSlop={8}>
                                <Text style={styles.linkBtn}>From product</Text>
                            </Pressable>
                        ) : null}
                        <Pressable onPress={addItem} hitSlop={8}>
                            <Text style={styles.linkBtn}>Add item</Text>
                        </Pressable>
                    </View>
                </View>

                {form.items.map((item, index) => (
                    <View key={index} style={styles.itemCard}>
                        <View style={styles.itemTop}>
                            <Text style={styles.itemIndex}>Item {index + 1}</Text>
                            {form.items.length > 1 ? (
                                <Pressable
                                    onPress={() => removeItem(index)}
                                    hitSlop={10}
                                    accessibilityLabel={`Remove item ${index + 1}`}
                                >
                                    <Trash2 size={18} color={colors.red600} strokeWidth={2} />
                                </Pressable>
                            ) : null}
                        </View>
                        <Label required>Description</Label>
                        <Input
                            value={item.description}
                            onChangeText={(v) => setItem(index, 'description', v)}
                            error={Boolean(fieldErrors[`item-${index}-description`])}
                            placeholder="Service or product"
                        />
                        <FieldError message={fieldErrors[`item-${index}-description`]} />
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Label required>Unit</Label>
                                <Pressable
                                    onPress={() => openUnitSheet(index)}
                                    style={styles.selectTrigger}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Unit for item ${index + 1}`}
                                >
                                    <Text style={styles.selectText} numberOfLines={1}>
                                        {normalizeInvoiceUnit(item.unit)}
                                    </Text>
                                    <ChevronDown size={18} color={colors.slate400} strokeWidth={2} />
                                </Pressable>
                                <Input
                                    value={item.quantity}
                                    onChangeText={(v) => setItem(index, 'quantity', v)}
                                    keyboardType="number-pad"
                                    error={Boolean(fieldErrors[`item-${index}-quantity`])}
                                    style={{ marginTop: spacing.sm }}
                                />
                                <FieldError message={fieldErrors[`item-${index}-quantity`]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Label required>Rate</Label>
                                <Pressable
                                    onPress={() => currencySheetRef.current?.expand()}
                                    style={styles.selectTrigger}
                                    accessibilityRole="button"
                                    accessibilityLabel="Rate currency"
                                >
                                    <Text style={styles.selectText} numberOfLines={1}>
                                        {normalizeCurrency(form.currency || APP_CURRENCY)}
                                    </Text>
                                    <ChevronDown size={18} color={colors.slate400} strokeWidth={2} />
                                </Pressable>
                                <Input
                                    value={item.rate}
                                    onChangeText={(v) => setItem(index, 'rate', v)}
                                    keyboardType="decimal-pad"
                                    error={Boolean(fieldErrors[`item-${index}-rate`])}
                                    style={{ marginTop: spacing.sm }}
                                />
                                <FieldError message={fieldErrors[`item-${index}-rate`]} />
                            </View>
                        </View>
                        <Text style={styles.lineAmount}>
                            Amount{' '}
                            {formatCurrency(
                                Number(item.quantity || 0) * Number(item.rate || 0),
                                form.currency
                            )}
                        </Text>
                    </View>
                ))}

                <Text style={styles.section}>Notes</Text>
                <View style={styles.fieldBlock}>
                    <Input
                        value={form.notes}
                        onChangeText={(v) => setField('notes', v)}
                        multiline
                        placeholder="Additional notes for the client…"
                        style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
                </View>

                <Text style={styles.section}>Terms & conditions</Text>
                <View style={styles.fieldBlock}>
                    <Input
                        value={form.terms}
                        onChangeText={(v) => setField('terms', v)}
                        multiline
                        placeholder="Quotation terms…"
                        style={{ minHeight: 140, textAlignVertical: 'top' }}
                    />
                </View>

                <Text style={styles.section}>Summary</Text>
                <View style={styles.summary}>
                    {form.clientName ? (
                        <Text style={styles.billTo}>Quote for {form.clientName}</Text>
                    ) : null}
                    <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal, form.currency)} />
                    {totals.discount > 0 ? (
                        <SummaryRow
                            label="Discount"
                            value={`−${formatCurrency(totals.discount, form.currency)}`}
                        />
                    ) : null}
                    <SummaryRow label="Tax" value={formatCurrency(totals.tax, form.currency)} />
                    <SummaryRow
                        label="Estimated total"
                        value={formatCurrency(totals.total, form.currency)}
                        bold
                    />
                </View>
            </ScrollView>

            <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
                {isDraftFlow ? (
                    <Button
                        title="Save as draft"
                        variant="secondary"
                        onPress={() => persist(true)}
                        disabled={saving}
                        style={styles.actionBtn}
                    />
                ) : null}
                <Button
                    title={primaryLabel}
                    onPress={() => persist(false)}
                    loading={saving}
                    style={styles.actionBtn}
                />
            </View>

            <BottomSheet ref={clientSheetRef} snapPoints={['55%']}>
                <Text style={styles.sheetTitle}>Saved clients</Text>
                <ScrollView>
                    {clients.map((c, i) => (
                        <ListRow
                            key={c.id}
                            title={c.name}
                            subtitle={[getClientBusiness(c), c.email].filter(Boolean).join(' · ')}
                            onPress={() => handleSelectSavedClient(c)}
                            last={i === clients.length - 1}
                            dense
                        />
                    ))}
                </ScrollView>
            </BottomSheet>

            <BottomSheet ref={productSheetRef} snapPoints={['50%']}>
                <Text style={styles.sheetTitle}>Add from products</Text>
                <ScrollView>
                    {products.map((p, i) => (
                        <ListRow
                            key={p.id}
                            title={p.name}
                            subtitle={formatCurrency(p.unitPrice ?? p.price ?? 0, form.currency)}
                            onPress={() => addProductAsItem(p)}
                            last={i === products.length - 1}
                            dense
                        />
                    ))}
                </ScrollView>
            </BottomSheet>

            <BottomSheet
                ref={unitSheetRef}
                snapPoints={['55%']}
                onClose={() => setUnitSheetIndex(null)}
            >
                <Text style={styles.sheetTitle}>Select unit</Text>
                <ScrollView>
                    {unitSheetOptions.map((opt, i) => (
                        <ListRow
                            key={opt.value}
                            title={opt.label}
                            onPress={() => handleUnitOptionSelect(opt.value)}
                            last={i === unitSheetOptions.length - 1}
                            dense
                        />
                    ))}
                </ScrollView>
            </BottomSheet>

            <BottomSheet ref={currencySheetRef} snapPoints={['45%']}>
                <Text style={styles.sheetTitle}>Select currency</Text>
                <ScrollView>
                    {SUPPORTED_CURRENCIES.map((c, i, arr) => (
                        <ListRow
                            key={c.code}
                            title={`${c.code} (${c.symbol})`}
                            subtitle={c.name}
                            onPress={() => handleCurrencySelect(c.code)}
                            last={i === arr.length - 1}
                            dense
                        />
                    ))}
                </ScrollView>
            </BottomSheet>

            <Modal
                visible={customUnitIndex != null}
                transparent
                animationType="fade"
                onRequestClose={() => setCustomUnitIndex(null)}
            >
                <View style={styles.customUnitOverlay}>
                    <View style={styles.customUnitBox}>
                        <Text style={styles.customUnitTitle}>Enter Unit Name</Text>
                        <TextInput
                            value={customUnitValue}
                            onChangeText={setCustomUnitValue}
                            placeholder="e.g. Lesson"
                            placeholderTextColor={colors.slate400}
                            style={styles.customUnitInput}
                            autoFocus
                            maxLength={40}
                        />
                        <View style={styles.customUnitActions}>
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={() => setCustomUnitIndex(null)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title="Save"
                                onPress={saveCustomUnit}
                                disabled={!customUnitValue.trim()}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <InvoiceLimitModal ref={limitModalRef} usage={invoiceUsage} onUpgrade={goUpgrade} />
        </KeyboardAvoidingView>
    );
}

function SummaryRow({ label, value, bold }) {
    return (
        <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
            <Text style={[styles.summaryValue, bold && styles.summaryBold]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    screen: { flex: 1 },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
    pageTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xxl,
        color: colors.foreground,
        letterSpacing: -0.5,
    },
    pageSub: {
        marginTop: spacing.sm,
        marginBottom: spacing.xxl,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
        lineHeight: lineHeight.md,
    },
    section: {
        marginTop: spacing.xl,
        marginBottom: spacing.md,
        fontFamily: fontFamily.semibold,
        fontSize: 12,
        color: colors.slate400,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    fieldBlock: { marginBottom: spacing.lg },
    readonlyInput: {
        backgroundColor: colors.slate100,
        color: colors.slate500,
    },
    dueToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        minHeight: touchTarget,
    },
    hint: {
        marginTop: spacing.sm,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.slate400,
        lineHeight: lineHeight.xs,
    },
    selectTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
        minHeight: touchTarget + 8,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    selectText: {
        flex: 1,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.foreground,
    },
    selectPlaceholder: { color: colors.slate400 },
    itemsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },
    itemsActions: { flexDirection: 'row', gap: spacing.lg },
    linkBtn: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.sm,
        color: colors.brand,
    },
    itemCard: {
        marginBottom: spacing.lg,
        padding: spacing.lg,
        borderRadius: radii.xl,
        backgroundColor: colors.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    itemTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    itemIndex: {
        fontFamily: fontFamily.semibold,
        fontSize: 11,
        color: colors.slate400,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    lineAmount: {
        marginTop: spacing.md,
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.muted,
        textAlign: 'right',
    },
    summary: {
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderLight,
    },
    billTo: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.muted,
        marginBottom: spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    summaryLabel: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.muted,
    },
    summaryValue: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.md,
        color: colors.foreground,
    },
    summaryBold: {
        fontFamily: fontFamily.bold,
        fontWeight: '700',
        color: colors.foreground,
        fontSize: fontSize.lg,
    },
    actionBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    actionBtn: { flex: 1 },
    sheetTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        marginBottom: spacing.md,
        letterSpacing: -0.3,
    },
    customUnitOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    customUnitBox: {
        backgroundColor: colors.surface,
        borderRadius: radii.xl,
        padding: spacing.xl,
    },
    customUnitTitle: {
        fontFamily: fontFamily.semibold,
        fontSize: fontSize.lg,
        color: colors.foreground,
        marginBottom: spacing.lg,
        letterSpacing: -0.3,
    },
    customUnitInput: {
        minHeight: touchTarget + 8,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.md,
        color: colors.foreground,
        marginBottom: spacing.xl,
    },
    customUnitActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
});
