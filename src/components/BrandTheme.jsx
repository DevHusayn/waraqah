import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { applyBrandTheme } from '../utils/brandTheme';

/** Syncs business brand color to CSS variables for the whole app. */
export default function BrandTheme() {
    const { businessInfo } = useSettings();

    useEffect(() => {
        applyBrandTheme(businessInfo.brandColor);
    }, [businessInfo.brandColor]);

    return null;
}
