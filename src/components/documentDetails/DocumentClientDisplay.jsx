import { User, Mail, Phone, Building2 } from 'lucide-react';
import FormSection from '../FormSection';
import { getClientBusiness } from '../../utils/clientHelpers';

export default function DocumentClientDisplay({
    client,
    additionalInfo,
    onEditClient,
    contactResolved = true,
}) {
    const emailOnFile = String(client?.email ?? '').trim();
    const missingEmail = Boolean(
        contactResolved && onEditClient && client && !emailOnFile
    );

    return (
        <FormSection icon={User} title="Client" description="Bill-to contact">
            {client ? (
                <div className="space-y-2">
                    <p className="font-semibold text-zinc-900 text-lg">{client.name}</p>
                    {getClientBusiness(client) && (
                        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                            <Building2 size={14} className="text-zinc-400" aria-hidden />
                            {getClientBusiness(client)}
                        </p>
                    )}
                    {emailOnFile ? (
                        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                            <Mail size={14} className="text-zinc-400" aria-hidden />
                            {emailOnFile}
                        </p>
                    ) : null}
                    {client.phone && (
                        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                            <Phone size={14} className="text-zinc-400" aria-hidden />
                            {client.phone}
                        </p>
                    )}
                    {client.address && (
                        <p className="text-sm text-zinc-600 whitespace-pre-wrap">{client.address}</p>
                    )}
                    {additionalInfo && (
                        <p className="text-sm text-zinc-600 whitespace-pre-wrap">{additionalInfo}</p>
                    )}
                    {missingEmail ? (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                            <p>No email on file. Add one to email this receipt to the client.</p>
                            <button
                                type="button"
                                className="mt-2 font-semibold text-brand hover:underline"
                                onClick={onEditClient}
                            >
                                Edit client
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : (
                <p className="text-zinc-500 text-sm">Client not found</p>
            )}
        </FormSection>
    );
}
