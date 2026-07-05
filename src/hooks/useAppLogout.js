import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_BRAND_COLOR } from '@waraqah/shared';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';

const DEFAULT_BUSINESS_INFO = {
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    defaultCurrency: 'NGN',
    taxRate: 10,
    brandColor: DEFAULT_BRAND_COLOR,
    plan: 'free',
    businessLogo: '',
    companyLogoUrl: '',
    companyLogoAvatarUrl: '',
    companyStampUrl: '',
    authorizedSignatureUrl: '',
    paymentAccountName: '',
    paymentBankName: '',
    paymentAccountNumber: '',
    paymentInstructions: '',
    invoiceTemplateId: 'classic',
};

export default function useAppLogout() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { setBusinessInfo } = useSettings();
    const { resetAll } = useInvoice();

    return useCallback(async () => {
        setBusinessInfo(DEFAULT_BUSINESS_INFO);
        resetAll();
        await logout();
        navigate('/auth');
    }, [setBusinessInfo, resetAll, logout, navigate]);
}
