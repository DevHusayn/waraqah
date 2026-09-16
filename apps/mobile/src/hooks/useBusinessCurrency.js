import { APP_CURRENCY, normalizeCurrency } from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';

export function useBusinessCurrency() {
    const { businessInfo } = useSettings();
    return normalizeCurrency(businessInfo?.defaultCurrency || APP_CURRENCY);
}
