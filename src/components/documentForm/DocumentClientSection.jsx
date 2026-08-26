import { Plus, Check, Users } from 'lucide-react';
import FormSection from '../FormSection';
import RequiredLabel from '../RequiredLabel';
import FieldValidationMessage from '../FieldValidationMessage';
import ClientNameCombobox from './ClientNameCombobox';
import { inputClass } from '../../utils/formFieldValidation';
import { hasClientDetails } from '../../utils/documentFormHelpers';

export default function DocumentClientSection({
    idPrefix,
    docLabel,
    formData,
    fieldErrors,
    clients,
    onNameChange,
    onEmailChange,
    onSelectClient,
    onOpenDetailsModal,
}) {
    return (
        <FormSection icon={Users} title="Client" description={`Who this ${docLabel} is for`}>
            <div className="space-y-4">
                <div>
                    <RequiredLabel htmlFor={`${idPrefix}-client-name`}>Client name</RequiredLabel>
                    <ClientNameCombobox
                        id={`${idPrefix}-client-name`}
                        value={formData.clientName}
                        clients={clients}
                        selectedClientId={formData.clientId}
                        onNameChange={onNameChange}
                        onSelectClient={onSelectClient}
                        error={Boolean(fieldErrors.clientName || fieldErrors.clientId)}
                    />
                    <FieldValidationMessage message={fieldErrors.clientName || fieldErrors.clientId} />
                </div>
                <div>
                    <label htmlFor={`${idPrefix}-client-email`} className="label">
                        Email{' '}
                        <span className="text-foreground-muted/70 font-normal">(optional)</span>
                    </label>
                    <input
                        id={`${idPrefix}-client-email`}
                        type="email"
                        name="clientEmail"
                        value={formData.clientEmail}
                        onChange={onEmailChange}
                        className={inputClass(Boolean(fieldErrors.clientEmail))}
                        placeholder="client@example.com"
                        aria-invalid={Boolean(fieldErrors.clientEmail)}
                    />
                    <FieldValidationMessage message={fieldErrors.clientEmail} />
                    <p className="mt-1.5 text-xs text-foreground-muted">
                        Add an email to send this {docLabel} directly to your client.
                    </p>
                </div>
                <div>
                    <button
                        type="button"
                        onClick={onOpenDetailsModal}
                        className={
                            hasClientDetails(formData)
                                ? 'inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark transition-colors'
                                : 'inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors'
                        }
                    >
                        {hasClientDetails(formData) ? (
                            <>
                                <Check size={16} aria-hidden />
                                Client details added
                            </>
                        ) : (
                            <>
                                <Plus size={16} aria-hidden />
                                Add more details
                            </>
                        )}
                    </button>
                </div>
            </div>
        </FormSection>
    );
}
