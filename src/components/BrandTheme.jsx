import { useEffect } from 'react';
import { applyBrandTheme, DEFAULT_BRAND_COLOR } from '../utils/brandTheme';

/** Keep the app chrome on the Waraqah emerald theme. Business colors are for PDFs only. */
export default function BrandTheme() {
    useEffect(() => {
        applyBrandTheme(DEFAULT_BRAND_COLOR);
    }, []);

    return null;
}
