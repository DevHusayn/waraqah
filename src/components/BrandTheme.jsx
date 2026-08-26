import { useEffect } from 'react';
import { applyBrandTheme, DEFAULT_BRAND_COLOR } from '../utils/brandTheme';
import { useTheme } from '../context/ThemeContext';

/** Keep the app chrome on the Waraqah emerald theme. Business colors are for PDFs only. */
export default function BrandTheme() {
    const { isDark } = useTheme();

    useEffect(() => {
        applyBrandTheme(DEFAULT_BRAND_COLOR, isDark);
    }, [isDark]);

    return null;
}
