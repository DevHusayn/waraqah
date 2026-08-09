import { useCallback } from 'react';
import { CUSTOM_UNIT_OPTION, DEFAULT_INVOICE_UNIT } from '@waraqah/shared';
import { normalizeCurrency } from '../utils/currency';
import { clientDetailsFromRecord } from '../utils/ensureInvoiceClient';
import { ensureInvoiceClient } from '../utils/ensureInvoiceClient';
import { clearFieldError } from '../utils/formFieldValidation';
import { isEmptyLineItem } from '../utils/documentFormHelpers';

export function useDocumentFormHandlers({
    formData,
    setFormData,
    setFieldErrors,
    clients,
    products,
    addClient,
    updateClient,
    setCustomUnitModal,
    customUnitModal,
    markDirty,
}) {
    const resolveClientId = useCallback(
        async (data, { createIfMissing = true } = {}) =>
            ensureInvoiceClient(data, clients, { addClient, updateClient, createIfMissing }),
        [clients, addClient, updateClient]
    );

    const handleClientNameChange = useCallback((e) => {
        markDirty();
        const { value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, clientName: value };
            if (prev.clientId) {
                const linked = clients.find((c) => c.id === prev.clientId);
                if (linked && linked.name !== value) {
                    next.clientId = '';
                }
            }
            return next;
        });
        clearFieldError(setFieldErrors, 'clientName');
        clearFieldError(setFieldErrors, 'clientId');
    }, [markDirty, setFormData, clients, setFieldErrors]);

    const handleClientEmailChange = useCallback((e) => {
        markDirty();
        setFormData((prev) => ({ ...prev, clientEmail: e.target.value }));
        clearFieldError(setFieldErrors, 'clientEmail');
    }, [markDirty, setFormData, setFieldErrors]);

    const applySelectedClient = useCallback(
        (client) => {
            if (!client) return;
            markDirty();
            setFormData((prev) => ({
                ...prev,
                clientId: client.id,
                clientName: client.name || '',
                clientEmail: client.email || '',
                ...clientDetailsFromRecord(client),
                clientAdditionalInfo: '',
            }));
            clearFieldError(setFieldErrors, 'clientName');
            clearFieldError(setFieldErrors, 'clientId');
            clearFieldError(setFieldErrors, 'clientEmail');
        },
        [markDirty, setFormData, setFieldErrors]
    );

    const handleSelectClient = useCallback(
        (clientOrId) => {
            const client =
                typeof clientOrId === 'string'
                    ? clients.find((c) => c.id === clientOrId)
                    : clientOrId;
            applySelectedClient(client);
        },
        [applySelectedClient, clients]
    );

    const handleSelectSavedClient = handleSelectClient;

    const handleSaveClientDetails = useCallback((details) => {
        markDirty();
        setFormData((prev) => ({
            ...prev,
            clientBusiness: details.business,
            clientPhone: details.phone,
            clientAddress: details.address,
            clientAdditionalInfo: details.additionalInfo,
        }));
    }, [markDirty, setFormData]);

    const handleChange = useCallback((e) => {
        markDirty();
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearFieldError(setFieldErrors, name);
    }, [markDirty, setFormData, setFieldErrors]);

    const handleItemChange = useCallback((index, field, value) => {
        markDirty();
        setFormData((prev) => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
        clearFieldError(setFieldErrors, `item-${index}-${field}`);
    }, [markDirty, setFormData, setFieldErrors]);

    const handleUnitChange = useCallback((index, value) => {
        if (value === CUSTOM_UNIT_OPTION) {
            setCustomUnitModal({ index });
            return;
        }
        handleItemChange(index, 'unit', value);
    }, [handleItemChange, setCustomUnitModal]);

    const handleCurrencyChange = useCallback((currency) => {
        markDirty();
        setFormData((prev) => ({
            ...prev,
            currency: normalizeCurrency(currency),
        }));
    }, [markDirty, setFormData]);

    const handleCustomUnitSave = useCallback((unitName) => {
        if (customUnitModal == null) return;
        handleItemChange(customUnitModal.index, 'unit', unitName.trim());
        setCustomUnitModal(null);
    }, [customUnitModal, handleItemChange, setCustomUnitModal]);

    const addItem = useCallback(() => {
        markDirty();
        setFormData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { description: '', quantity: 1, rate: 0, unit: DEFAULT_INVOICE_UNIT },
            ],
        }));
    }, [markDirty, setFormData]);

    const addProductItem = useCallback((productId, preferredIndex) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        markDirty();
        const description = product.description
            ? `${product.name} — ${product.description}`
            : product.name;
        const newLine = {
            description,
            quantity: 1,
            rate: product.unitPrice || 0,
            unit: DEFAULT_INVOICE_UNIT,
        };

        const resolveTargetIndex = (items) => {
            if (
                preferredIndex != null &&
                preferredIndex >= 0 &&
                preferredIndex < items.length &&
                isEmptyLineItem(items[preferredIndex])
            ) {
                return preferredIndex;
            }
            return items.findIndex(isEmptyLineItem);
        };

        const emptyIndex = resolveTargetIndex(formData.items);

        setFormData((prev) => {
            const targetIndex = resolveTargetIndex(prev.items);
            if (targetIndex === -1) {
                return { ...prev, items: [...prev.items, newLine] };
            }
            const items = [...prev.items];
            items[targetIndex] = newLine;
            return { ...prev, items };
        });

        if (emptyIndex !== -1) {
            setFieldErrors((fieldPrev) => {
                const next = { ...fieldPrev };
                delete next[`item-${emptyIndex}-description`];
                delete next[`item-${emptyIndex}-quantity`];
                delete next[`item-${emptyIndex}-rate`];
                return next;
            });
        }
    }, [markDirty, products, formData.items, setFormData, setFieldErrors]);

    const removeItem = useCallback((index) => {
        setFormData((prev) => {
            if (prev.items.length <= 1) return prev;
            markDirty();
            return { ...prev, items: prev.items.filter((_, i) => i !== index) };
        });
    }, [markDirty, setFormData]);

    const createExpiryToggleHandler = useCallback(
        (hasFieldKey, dateFieldKey) => () => {
            markDirty();
            setFormData((prev) => ({ ...prev, [hasFieldKey]: !prev[hasFieldKey] }));
            clearFieldError(setFieldErrors, dateFieldKey);
        },
        [markDirty, setFormData, setFieldErrors]
    );

    const createExpiryDateChangeHandler = useCallback(
        (dateFieldKey) => (val) => {
            markDirty();
            setFormData((prev) => ({ ...prev, [dateFieldKey]: val }));
            clearFieldError(setFieldErrors, dateFieldKey);
        },
        [markDirty, setFormData, setFieldErrors]
    );

    const createIssueDateChangeHandler = useCallback(
        () => (val) => {
            markDirty();
            setFormData((prev) => ({ ...prev, date: val }));
            clearFieldError(setFieldErrors, 'date');
        },
        [markDirty, setFormData, setFieldErrors]
    );

    return {
        resolveClientId,
        handleClientNameChange,
        handleClientEmailChange,
        handleSelectClient,
        handleSelectSavedClient,
        handleSaveClientDetails,
        handleChange,
        handleItemChange,
        handleUnitChange,
        handleCurrencyChange,
        handleCustomUnitSave,
        addItem,
        addProductItem,
        removeItem,
        createExpiryToggleHandler,
        createExpiryDateChangeHandler,
        createIssueDateChangeHandler,
    };
}
