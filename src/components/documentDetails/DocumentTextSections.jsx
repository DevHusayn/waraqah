import FormSection from '../FormSection';
import { StickyNote, ScrollText } from 'lucide-react';

export function DocumentNotesDisplay({ notes }) {
    if (!notes) return null;

    return (
        <FormSection icon={StickyNote} title="Notes" description="Additional information">
            <p className="text-zinc-600 whitespace-pre-wrap text-sm leading-relaxed">{notes}</p>
        </FormSection>
    );
}

export function DocumentTermsDisplay({ terms }) {
    if (!terms) return null;

    return (
        <FormSection icon={ScrollText} title="Terms & Conditions" description="Quotation terms">
            <p className="text-zinc-600 whitespace-pre-wrap text-sm leading-relaxed">{terms}</p>
        </FormSection>
    );
}
