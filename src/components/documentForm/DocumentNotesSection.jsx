import FormSection from '../FormSection';
import { StickyNote, ScrollText } from 'lucide-react';
import { inputClass } from '../../utils/formFieldValidation';

export function DocumentNotesSection({ description, placeholder, formData, onChange }) {
    return (
        <FormSection icon={StickyNote} title="Notes" description={description}>
            <textarea
                name="notes"
                value={formData.notes}
                onChange={onChange}
                className={inputClass(false, 'resize-none min-h-[100px]')}
                rows={4}
                placeholder={placeholder}
            />
        </FormSection>
    );
}

export function DocumentTermsSection({ formData, onChange }) {
    return (
        <FormSection
            icon={ScrollText}
            title="Terms & Conditions"
            description="Shown with this quotation"
        >
            <textarea
                name="terms"
                value={formData.terms}
                onChange={onChange}
                className={inputClass(false, 'resize-none min-h-[140px]')}
                rows={6}
                placeholder="Quotation terms…"
            />
        </FormSection>
    );
}
