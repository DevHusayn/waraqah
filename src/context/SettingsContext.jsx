import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};


export const SettingsProvider = ({ children }) => {
    const [businessInfo, setBusinessInfo] = useState({
        name: '', address: '', email: '', phone: '', website: '', defaultCurrency: 'NGN', taxRate: 10, brandColor: '#0ea5e9', plan: 'free', businessLogo: '',
    });
    const [loading, setLoading] = useState(true);

    // Load business info from backend on mount
    useEffect(() => {
        async function fetchBusinessInfo() {
            setLoading(true);
            try {
                const info = await apiFetch('/business-info');
                setBusinessInfo(info);
            } catch {
                let fallback = { name: '', address: '', email: '', phone: '', website: '', defaultCurrency: 'NGN', taxRate: 10, brandColor: '#0ea5e9', plan: 'free', businessLogo: '' };
                if (import.meta.env.DEV) {
                    try {
                        const stored = localStorage.getItem('waraqah_business');
                        if (stored) fallback = { ...fallback, ...JSON.parse(stored) };
                    } catch { /* ignore */ }
                    if (localStorage.getItem('waraqah_plan') === 'premium') {
                        fallback.plan = 'premium';
                    }
                }
                setBusinessInfo(fallback);
            } finally {
                setLoading(false);
            }
        }
        fetchBusinessInfo();
    }, []);

    const updateBusinessInfo = async (info) => {
        try {
            const updated = await apiFetch('/business-info', {
                method: 'PUT',
                body: JSON.stringify(info),
            });
            setBusinessInfo(updated);
            if (import.meta.env.DEV) {
                localStorage.setItem('waraqah_business', JSON.stringify(updated));
            }
        } catch {
            setBusinessInfo(info);
            if (import.meta.env.DEV) {
                localStorage.setItem('waraqah_business', JSON.stringify(info));
            }
            throw new Error('Could not save settings. Logo and details are stored locally for this session in dev mode.');
        }
    };

    const value = {
        businessInfo,
        updateBusinessInfo,
        setBusinessInfo,
        loading,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
