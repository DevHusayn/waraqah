import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_BRAND_COLOR } from '@waraqah/shared';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useInvoice } from '../context/InvoiceContext';
import { clearGoogleAuthSession } from '../utils/googleAuth';

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
    const { logout, user } = useAuth();
    const { setBusinessInfo } = useSettings();
    const { resetAll } = useInvoice();

    return useCallback(async () => {
        const googleEmail = user?.authProvider === 'google' ? user.email : null;
        setBusinessInfo(DEFAULT_BUSINESS_INFO);
        resetAll();
        await logout();
        clearGoogleAuthSession(googleEmail);
        navigate('/auth');
    }, [setBusinessInfo, resetAll, logout, navigate, user]);
}
