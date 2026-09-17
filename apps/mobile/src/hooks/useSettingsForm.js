import { useEffect, useState } from 'react';
import {
    buildProfileFieldErrors,
    buildAccountFieldErrors,
    buildBrandingFieldErrors,
    buildSettingsFieldErrors,
    withDefaultPaymentInstructions,
    withDefaultDocumentFooter,
} from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

const SECTION_PAYLOAD_KEYS = {
    profile: ['name', 'address', 'email', 'phone', 'website', 'country', 'defaultCurrency', 'timezone'],
    account: [
        'paymentAccountName',
        'paymentBankName',
        'paymentAccountNumber',
        'paymentSortCode',
        'paymentIban',
        'paymentSwift',
        'paymentInstructions',
    ],
    branding: ['brandColor', 'defaultDocumentFooter'],
    all: [
        'name',
        'address',
        'email',
        'phone',
        'website',
        'country',
        'defaultCurrency',
        'timezone',
        'paymentAccountName',
        'paymentBankName',
        'paymentAccountNumber',
        'paymentSortCode',
        'paymentIban',
        'paymentSwift',
        'paymentInstructions',
        'brandColor',
        'defaultDocumentFooter',
    ],
};

function pickFormSlice(form, keys) {
    return Object.fromEntries(keys.map((key) => [key, form[key]]));
}

export function useSettingsForm(section = 'all') {
    const { businessInfo, updateBusinessInfo, loading } = useSettings();
    const { showToast } = useToast();
    const [form, setForm] = useState(
        withDefaultDocumentFooter(withDefaultPaymentInstructions({ ...businessInfo }))
    );
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(withDefaultDocumentFooter(withDefaultPaymentInstructions({ ...businessInfo })));
    }, [businessInfo]);

    const setField = (key, value) => {
        setForm((f) => ({ ...f, [key]: value }));
        if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
    };

    const validate = () => {
        let next = {};
        if (section === 'profile') next = buildProfileFieldErrors(form);
        else if (section === 'account') next = buildAccountFieldErrors(form);
        else if (section === 'branding') next = buildBrandingFieldErrors(form);
        else next = buildSettingsFieldErrors(form);
        setErrors(next);
        return !Object.values(next).some(Boolean);
    };

    const save = async () => {
        if (!validate()) return false;
        setSaving(true);
        try {
            const keys = SECTION_PAYLOAD_KEYS[section] || SECTION_PAYLOAD_KEYS.all;
            await updateBusinessInfo(pickFormSlice(form, keys));
            showToast('Settings saved', 'success');
            return true;
        } catch (err) {
            showToast(err.message, 'error');
            return false;
        } finally {
            setSaving(false);
        }
    };

    return { form, setField, errors, saving, save, loading, validate };
}
