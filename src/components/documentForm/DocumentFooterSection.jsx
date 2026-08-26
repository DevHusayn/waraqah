import FormSection from '../FormSection';
import { AlignCenter } from 'lucide-react';
import { getDefaultDocumentFooter } from '@waraqah/shared';
import { inputClass } from '../../utils/formFieldValidation';
import { isPremiumUser } from '../../utils/premium';

export function DocumentFooterSection({ businessInfo, mode = 'invoice', formData, onChange }) {
    if (!isPremiumUser(businessInfo)) return null;

    const placeholder = getDefaultDocumentFooter(businessInfo?.name, mode);

    return (
        <FormSection
            icon={AlignCenter}
            title="Footer message"
            description="Shown at the bottom of the PDF"
        >
            <textarea
                name="documentFooter"
                value={formData.documentFooter ?? ''}
                onChange={onChange}
                className={inputClass(false, 'resize-none min-h-[80px]')}
                rows={3}
                placeholder={placeholder}
            />
        </FormSection>
    );
}
