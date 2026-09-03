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
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ChevronDown, Plus, Check, Trash2 } from 'lucide-react-native';
import {
    APP_CURRENCY,
    buildInvoiceFieldErrors,
    buildDraftFieldErrors,
    buildLineItemAddFieldErrors,
    buildUnitSelectOptions,
    calculateInvoiceTotals,
    CUSTOM_UNIT_OPTION,
    DEFAULT_INVOICE_UNIT,
    DRAFT_STATUS,
    formatCurrency,
    isDraft,
    normalizeCurrency,
    normalizeInvoiceUnit,
    SUPPORTED_CURRENCIES,
    getDefaultDocumentFooter,
    isAiDraftsEnabled,
    isPremiumUser,
    RECURRING_FREQUENCY_OPTIONS,
    getRecurringFrequencyLabel,
    recurringFieldsFromRecord,
    toRecurringApiFields,
} from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { InvoiceLimitModal } from '../components/InvoiceLimitModal';
import { AiDraftComposer, applyMobileAiDraft } from '../components/AiDraftComposer';
import { ClientNameCombobox } from '../components/ClientNameCombobox';
import { ClientDetailsModal } from '../components/ClientDetailsModal';
import {
    BottomSheet,
    Button,
    FieldError,
    Input,
    Label,
    ListRow,
} from '../components/ui';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { useShakeAnimation } from '../hooks/useShakeAnimation';
import { ensureInvoiceClient, clientDetailsFromRecord } from '../utils/ensureInvoiceClient';
import { colors, fontFamily, fontSize, lineHeight, radii, spacing, touchTarget, useTheme } from '../theme';

const emptyItem = () => ({
    description: '',
    quantity: '1',
    rate: '0',
    unit: DEFAULT_INVOICE_UNIT,
});

function hasClientDetails(form) {
    return Boolean(
        String(form.clientBusiness || '').trim() ||
            String(form.clientPhone || '').trim() ||
            String(form.clientAddress || '').trim() ||
            String(form.clientAdditionalInfo || '').trim()
    );
}

function buildPayload(form, status) {
    const items = form.items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity),
        rate: Number(it.rate),
        unit: normalizeInvoiceUnit(it.unit),
        ...(it.productId ? { productId: it.productId } : {}),
    }));
    const totals = calculateInvoiceTotals(items, {
        taxRate: form.taxRate,
        discountType: 'percent',
        discountValue: form.discountValue || 0,
    });

    const payload = {
        clientId: form.clientId || null,
        date: form.date,
        dueDate: form.hasDueDate ? form.dueDate : null,
        items,
        notes: form.notes || '',
        documentFooter: form.documentFooter || '',
        clientAdditionalInfo: form.clientAdditionalInfo || '',
        status,
        currency: normalizeCurrency(form.currency || APP_CURRENCY),
        taxRate: Number(form.taxRate) || 0,
        discountType: 'percent',
        discountValue: Number(form.discountValue) || 0,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        ...toRecurringApiFields(form),
    };

    return payload;
}

export function CreateInvoiceScreen({ route, navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const editId = route.params?.id;
    const insets = useSafeAreaInsets();
    const {
        clients,
        invoices,
        draftInvoices,
        products,
        addInvoice,
        updateInvoice,
        addClient,
        updateClient,
        fetchProducts,
    } = useInvoice();
    const { businessInfo } = useSettings();
    const premium = isPremiumUser(businessInfo);
    const { showToast } = useToast();
    const limitModalRef = useRef(null);
    const productSheetRef = useRef(null);
    const unitSheetRef = useRef(null);
    const currencySheetRef = useRef(null);
    const frequencySheetRef = useRef(null);
    const [unitSheetIndex, setUnitSheetIndex] = useState(null);
    const [customUnitIndex, setCustomUnitIndex] = useState(null);
    const [customUnitName, setCustomUnitName] = useState('');
    const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
    const { invoiceUsage, tryCreate, goUpgrade } = useInvoiceCreateGuard(limitModalRef, navigation);

    const existing = useMemo(() => {
        if (!editId) return null;
        return (
            draftInvoices.find((i) => i.id === editId) ||
            invoices.find((i) => i.id === editId) ||
            null
        );
    }, [editId, draftInvoices, invoices]);

    const isDraftFlow = !editId || isDraft(existing);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [itemErrorPulse, setItemErrorPulse] = useState(0);
    const itemShakeAnim = useShakeAnimation(itemErrorPulse);
    const [form, setForm] = useState({
        invoiceNumber: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientBusiness: '',
        clientPhone: '',
        clientAddress: '',
        clientAdditionalInfo: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
        hasDueDate: true,
        items: [emptyItem()],
        notes: '',
        documentFooter: '',
        currency: APP_CURRENCY,
        taxRate: '10',
        discountValue: '',
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: '',
    });

    useEffect(() => {
        fetchProducts().catch(() => {});
    }, [fetchProducts]);

    useEffect(() => {
        if (editId || !premium) return;
        setForm((prev) => {
            if (String(prev.documentFooter || '').trim()) return prev;
            return {
                ...prev,
                documentFooter: getDefaultDocumentFooter(businessInfo?.name, 'invoice'),
            };
        });
    }, [editId, premium, businessInfo?.name]);

    useEffect(() => {
        if (!editId || !existing) return;
        if (
            existing.status === 'paid' ||
            existing.status === 'cancelled' ||
            Number(existing.amountPaid) > 0
        ) {
            navigation.replace('InvoiceDetail', { id: editId });
            return;
        }
        const linked = clients.find((c) => c.id === existing.clientId);
        setForm({
            invoiceNumber: existing.invoiceNumber || '',
            clientId: existing.clientId || '',
            clientName: linked?.name || '',
            clientEmail: linked?.email || '',
            ...clientDetailsFromRecord(linked),
            clientAdditionalInfo: existing.clientAdditionalInfo || '',
            date: existing.date ? format(new Date(existing.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            dueDate: existing.dueDate
                ? format(new Date(existing.dueDate), 'yyyy-MM-dd')
                : format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
            hasDueDate: Boolean(existing.dueDate),
            items:
                (existing.items || []).length > 0
                    ? existing.items.map((it) => ({
                          description: it.description || '',
                          quantity: String(it.quantity ?? 1),
                          rate: String(it.rate ?? 0),
                          unit: normalizeInvoiceUnit(it.unit),
                          ...(it.productId ? { productId: it.productId } : {}),
                      }))
                    : [emptyItem()],
            notes: existing.notes || '',
            documentFooter:
                existing.documentFooter?.trim() ||
                getDefaultDocumentFooter(businessInfo?.name, 'invoice'),
            currency: normalizeCurrency(existing.currency || APP_CURRENCY),
            taxRate: String(existing.taxRate ?? 10),
            discountValue:
                existing.discountValue != null && existing.discountValue !== ''
                    ? String(existing.discountValue)
                    : '',
            ...recurringFieldsFromRecord(existing),
        });
    }, [editId, existing, clients, navigation, businessInfo?.name]);

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

    const handleSelectClient = (client) => {
        if (!client) return;
        setForm((prev) => ({
            ...prev,
            clientId: client.id,
            clientName: client.name || '',
            clientEmail: client.email || '',
            ...clientDetailsFromRecord(client),
            clientAdditionalInfo: '',
        }));
        clearError('clientName');
        clearError('clientId');
        clearError('clientEmail');
    };

    const setItem = (index, key, value) => {
        setForm((f) => {
            const items = [...f.items];
            items[index] = { ...items[index], [key]: value };
            return { ...f, items };
        });
        clearError(`item-${index}-${key}`);
    };

    const addItem = () => {
        const lastIndex = form.items.length - 1;
        const item = form.items[lastIndex];
        const errors = buildLineItemAddFieldErrors(item, lastIndex);
        if (Object.keys(errors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...errors }));
            setItemErrorPulse((pulse) => pulse + 1);
            return;
        }
        setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
    };
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
        hasDueDate: form.hasDueDate,
        dueDate: form.hasDueDate ? form.dueDate : null,
    });

    const persist = async (asDraft = false) => {
        if (!asDraft && !editId && !tryCreate(() => {})) return;

        const shape = validationShape();
        const errors = asDraft ? buildDraftFieldErrors(shape) : buildInvoiceFieldErrors(shape);
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
                        clientBusiness: form.clientBusiness,
                        clientPhone: form.clientPhone,
                        clientAddress: form.clientAddress,
                    },
                    clients,
                    { addClient, updateClient, createIfMissing: !asDraft }
                );
            }

            const status = asDraft
                ? DRAFT_STATUS
                : existing && !isDraft(existing)
                  ? existing.status
                  : 'pending';

            const payload = {
                ...buildPayload({ ...form, clientId }, status),
                clientId: clientId || null,
            };

            if (editId) {
                await updateInvoice(editId, payload);
                showToast(asDraft ? 'Draft saved' : 'Invoice updated', 'success');
            } else {
                await addInvoice(payload);
                showToast(asDraft ? 'Draft saved' : 'Invoice created', 'success');
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

    const openCurrencySheet = () => {
        currencySheetRef.current?.expand();
    };

    const handleCurrencySelect = (code) => {
        setField('currency', normalizeCurrency(code));
        currencySheetRef.current?.close();
    };

    const handleUnitOptionSelect = (value) => {
        if (unitSheetIndex == null) return;
        unitSheetRef.current?.close();
        if (value === CUSTOM_UNIT_OPTION) {
            setCustomUnitName('');
            setCustomUnitIndex(unitSheetIndex);
            return;
        }
        setItem(unitSheetIndex, 'unit', value);
    };

    const saveCustomUnit = () => {
        const trimmed = customUnitName.trim();
        if (!trimmed || customUnitIndex == null) return;
        setItem(customUnitIndex, 'unit', trimmed);
        setCustomUnitIndex(null);
        setCustomUnitName('');
    };

    const invoiceNumberDisplay = isDraftFlow
        ? form.invoiceNumber || 'Assigned when sent'
        : form.invoiceNumber || '—';

    const title = !editId ? 'Create invoice' : isDraftFlow ? 'Complete invoice' : 'Edit invoice';
    const primaryLabel = !editId || isDraftFlow ? 'Create invoice' : 'Save changes';
    const unitSheetOptions =
        unitSheetIndex != null
            ? buildUnitSelectOptions(form.items[unitSheetIndex]?.unit)
            : buildUnitSelectOptions(DEFAULT_INVOICE_UNIT);

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

                {isAiDraftsEnabled() && isDraftFlow ? (
                    <AiDraftComposer
                        documentType="invoice"
                        premium={premium}
                        disabled={saving}
                        onUpgrade={goUpgrade}
                        onApply={(draft) => {
                            setForm((prev) => applyMobileAiDraft(prev, draft));
                            setFieldErrors({});
                            showToast('Draft filled in. Review it before saving.', 'success');
                        }}
                    />
                ) : null}

                {/* Invoice details */}
                <Text style={styles.section}>Invoice details</Text>
                <View style={styles.fieldBlock}>
                    <Label>Invoice number</Label>
                    <Input
                        value={invoiceNumberDisplay}
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
                        placeholder="10"
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
                        <Label>Due date</Label>
                        <Switch
                            value={form.hasDueDate}
                            onValueChange={(on) => setField('hasDueDate', on)}
                            trackColor={{ false: colors.slate200, true: colors.brandSecondary }}
                            thumbColor={form.hasDueDate ? colors.brand : colors.slate400}
                            accessibilityLabel="Include due date"
                        />
                    </View>
                    {form.hasDueDate ? (
                        <>
                            <Input
                                value={form.dueDate}
                                onChangeText={(v) => setField('dueDate', v)}
                                error={Boolean(fieldErrors.dueDate)}
                                placeholder="YYYY-MM-DD"
                                autoCapitalize="none"
                            />
                            <FieldError message={fieldErrors.dueDate} />
                        </>
                    ) : (
                        <Text style={styles.hint}>No payment deadline will appear on this invoice.</Text>
                    )}
                </View>

                {/* Client — form fields like web */}
                <Text style={styles.section}>Client</Text>
                <View style={styles.fieldBlock}>
                    <Label required>Client name</Label>
                    <ClientNameCombobox
                        value={form.clientName}
                        onChangeText={handleClientNameChange}
                        onSelectClient={handleSelectClient}
                        clients={clients}
                        selectedClientId={form.clientId}
                        error={Boolean(fieldErrors.clientName || fieldErrors.clientId)}
                        fieldError={fieldErrors.clientName || fieldErrors.clientId}
                    />
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
                    <Text style={styles.hint}>Add an email to send this invoice directly to your client.</Text>
                </View>
                <Pressable
                    onPress={() => setClientDetailsOpen(true)}
                    style={styles.clientDetailsBtn}
                    accessibilityRole="button"
                    accessibilityLabel={
                        hasClientDetails(form) ? 'Edit client details' : 'Add more details'
                    }
                >
                    {hasClientDetails(form) ? (
                        <>
                            <Check size={16} color={colors.brand} strokeWidth={2.5} />
                            <Text style={styles.clientDetailsBtnTextActive}>Client details added</Text>
                        </>
                    ) : (
                        <>
                            <Plus size={16} color={colors.slate600} strokeWidth={2.5} />
                            <Text style={styles.clientDetailsBtnText}>Add more details</Text>
                        </>
                    )}
                </Pressable>

                {/* Items */}
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

                {form.items.map((item, index) => {
                    const isLastItem = index === form.items.length - 1;
                    const ItemShell = isLastItem ? Animated.View : View;
                    const itemShellStyle = isLastItem
                        ? [styles.itemCard, { transform: [{ translateX: itemShakeAnim }] }]
                        : styles.itemCard;

                    return (
                    <ItemShell key={index} style={itemShellStyle}>
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
                            multiline
                            style={{ minHeight: 72, textAlignVertical: 'top' }}
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
                                    accessibilityLabel={`${normalizeInvoiceUnit(item.unit)} for item ${index + 1}`}
                                    style={{ marginTop: spacing.sm }}
                                />
                                <FieldError message={fieldErrors[`item-${index}-quantity`]} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Label required>Rate</Label>
                                <Pressable
                                    onPress={openCurrencySheet}
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
                    </ItemShell>
                    );
                })}

                <Text style={styles.section}>Repeating</Text>
                <View style={styles.fieldBlock}>
                    <View style={styles.dueToggleRow}>
                        <Label>Repeat this invoice</Label>
                        <Switch
                            value={Boolean(form.isRecurring)}
                            onValueChange={(on) => setField('isRecurring', on)}
                            trackColor={{ false: colors.slate200, true: colors.brandSecondary }}
                            thumbColor={form.isRecurring ? colors.brand : colors.slate400}
                            accessibilityLabel="Repeat this invoice"
                        />
                    </View>
                    {form.isRecurring ? (
                        <>
                            <Label>Frequency</Label>
                            <Pressable
                                onPress={() => frequencySheetRef.current?.expand()}
                                style={styles.selectTrigger}
                                accessibilityRole="button"
                                accessibilityLabel="Choose frequency"
                            >
                                <Text style={styles.selectText}>
                                    {getRecurringFrequencyLabel(form.recurringFrequency || 'monthly')}
                                </Text>
                                <ChevronDown size={18} color={colors.slate400} />
                            </Pressable>
                            <View style={{ height: spacing.md }} />
                            <Label>End date (optional)</Label>
                            <Input
                                value={form.recurringEndDate || ''}
                                onChangeText={(v) => setField('recurringEndDate', v)}
                                placeholder="YYYY-MM-DD"
                                autoCapitalize="none"
                            />
                            <Text style={styles.hint}>Leave blank to keep repeating until you stop it.</Text>
                        </>
                    ) : (
                        <Text style={styles.hint}>Turn this on to automatically create the next invoice.</Text>
                    )}
                </View>

                {/* Notes */}
                <Text style={styles.section}>Notes</Text>
                <View style={styles.fieldBlock}>
                    <Input
                        value={form.notes}
                        onChangeText={(v) => setField('notes', v)}
                        multiline
                        placeholder="Payment terms, thank-you note…"
                        style={{ minHeight: 96, textAlignVertical: 'top' }}
                    />
                </View>

                {premium ? (
                    <>
                        <Text style={styles.section}>Footer message</Text>
                        <Text style={styles.hint}>Shown at the bottom of the PDF</Text>
                        <View style={styles.fieldBlock}>
                            <Input
                                value={form.documentFooter}
                                onChangeText={(v) => setField('documentFooter', v)}
                                multiline
                                placeholder={getDefaultDocumentFooter(businessInfo?.name, 'invoice')}
                                style={{ minHeight: 80, textAlignVertical: 'top' }}
                            />
                        </View>
                    </>
                ) : null}

                {/* Summary */}
                <Text style={styles.section}>Summary</Text>
                <View style={styles.summary}>
                    {form.clientName ? (
                        <Text style={styles.billTo}>Bill to {form.clientName}</Text>
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
                        label="Total"
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

            <BottomSheet ref={frequencySheetRef} snapPoints={['50%']}>
                <Text style={styles.sheetTitle}>How often</Text>
                <ScrollView>
                    {RECURRING_FREQUENCY_OPTIONS.map((opt, i, arr) => (
                        <ListRow
                            key={opt.value}
                            title={opt.label}
                            onPress={() => {
                                setField('recurringFrequency', opt.value);
                                frequencySheetRef.current?.close();
                            }}
                            last={i === arr.length - 1}
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
                            value={customUnitName}
                            onChangeText={setCustomUnitName}
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
                                disabled={!customUnitName.trim()}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <ClientDetailsModal
                visible={clientDetailsOpen}
                onClose={() => setClientDetailsOpen(false)}
                initialData={{
                    business: form.clientBusiness,
                    phone: form.clientPhone,
                    address: form.clientAddress,
                    additionalInfo: form.clientAdditionalInfo,
                }}
                onSave={(details) =>
                    setForm((prev) => ({
                        ...prev,
                        clientBusiness: details.business,
                        clientPhone: details.phone,
                        clientAddress: details.address,
                        clientAdditionalInfo: details.additionalInfo,
                    }))
                }
            />

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

function createStyles(colors) {
    return StyleSheet.create({
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
    clientDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
        minHeight: touchTarget,
    },
    clientDetailsBtnText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.slate600,
    },
    clientDetailsBtnTextActive: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.brand,
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
}
