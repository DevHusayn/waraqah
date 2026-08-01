import { Plus, Check, Users } from 'lucide-react';
import FormSection from '../FormSection';
import RequiredLabel from '../RequiredLabel';
import FieldValidationMessage from '../FieldValidationMessage';
import CustomSelect from '../CustomSelect';
import { inputClass } from '../../utils/formFieldValidation';
import { getClientBusiness } from '../../utils/clientHelpers';
import { hasClientDetails } from '../../utils/documentFormHelpers';

export default function DocumentClientSection({
    idPrefix,
    docLabel,
    formData,
    fieldErrors,
    clients,
    onNameChange,
    onEmailChange,
    onSelectSavedClient,
    onOpenDetailsModal,
}) {
    return (
        <FormSection icon={Users} title="Client" description={`Who this ${docLabel} is for`}>
            <div className="space-y-4">
                <div>
                    <RequiredLabel htmlFor={`${idPrefix}-client-name`}>Client name</RequiredLabel>
                    <input
                        id={`${idPrefix}-client-name`}
                        type="text"
                        name="clientName"
                        value={formData.clientName}
                        onChange={onNameChange}
                        className={inputClass(Boolean(fieldErrors.clientName || fieldErrors.clientId))}
                        placeholder="John Doe"
                        aria-invalid={Boolean(fieldErrors.clientName || fieldErrors.clientId)}
                    />
                    <FieldValidationMessage message={fieldErrors.clientName || fieldErrors.clientId} />
                </div>
                <div>
                    <label htmlFor={`${idPrefix}-client-email`} className="label">
                        Email{' '}
                        <span className="text-zinc-400 font-normal">(optional)</span>
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
                    <p className="mt-1.5 text-xs text-zinc-500">
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
                                : 'inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors'
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
                {clients.length > 0 && (
                    <div>
                        <label htmlFor={`${idPrefix}-saved-client`} className="label">
                            Fill from saved client
                        </label>
                        <CustomSelect
                            id={`${idPrefix}-saved-client`}
                            value={formData.clientId}
                            onChange={onSelectSavedClient}
                            options={clients.map((client) => ({
                                value: client.id,
                                label: `${client.name}${getClientBusiness(client) ? ` — ${getClientBusiness(client)}` : ''}`,
                            }))}
                            placeholder="Choose a saved client"
                        />
                    </div>
                )}
            </div>
        </FormSection>
    );
}
