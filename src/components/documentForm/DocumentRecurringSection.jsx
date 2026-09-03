import { Repeat } from 'lucide-react';
import FormSection from '../FormSection';
import RecurringScheduleFields from '../RecurringScheduleFields';

export default function DocumentRecurringSection({
    idPrefix = 'invoice',
    formData,
    fieldErrors,
    onToggle,
    onFrequencyChange,
    onEndDateChange,
}) {
    return (
        <FormSection
            icon={Repeat}
            title="Repeating"
            description="Automatically create the next invoice on a schedule"
        >
            <RecurringScheduleFields
                idPrefix={idPrefix}
                isRecurring={Boolean(formData.isRecurring)}
                frequency={formData.recurringFrequency || 'monthly'}
                endDate={formData.recurringEndDate}
                onToggle={onToggle}
                onFrequencyChange={onFrequencyChange}
                onEndDateChange={onEndDateChange}
                fieldErrors={fieldErrors}
            />
        </FormSection>
    );
}
