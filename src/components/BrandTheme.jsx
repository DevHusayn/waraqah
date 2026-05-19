import { useEffect } from 'react';
import { applyBrandTheme } from '../utils/brandTheme';

/** Keep the app chrome on the Waraqah sky-blue theme. Business colors are for PDFs only. */
export default function BrandTheme() {
    useEffect(() => {
        applyBrandTheme('#0284c7');
    }, []);

    return null;
}
