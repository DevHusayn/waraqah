import { Link } from 'react-router-dom';
import { User, Mail, Phone, Building2 } from 'lucide-react';
import FormSection from '../FormSection';
import { formatDocumentAdditionalInfo } from '@waraqah/shared';
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
                    {client.id ? (
                        <Link
                            to={`/clients/${client.id}`}
                            className="font-semibold text-foreground text-lg hover:text-brand hover:underline"
                        >
                            {client.name}
                        </Link>
                    ) : (
                        <p className="font-semibold text-foreground text-lg">{client.name}</p>
                    )}
                    {getClientBusiness(client) && (
                        <p className="text-sm text-foreground-muted flex items-center gap-1.5">
                            <Building2 size={14} className="text-foreground-muted/70" aria-hidden />
                            {getClientBusiness(client)}
                        </p>
                    )}
                    {emailOnFile ? (
                        <p className="text-sm text-foreground-muted flex items-center gap-1.5">
                            <Mail size={14} className="text-foreground-muted/70" aria-hidden />
                            {emailOnFile}
                        </p>
                    ) : null}
                    {client.phone && (
                        <p className="text-sm text-foreground-muted flex items-center gap-1.5">
                            <Phone size={14} className="text-foreground-muted/70" aria-hidden />
                            {client.phone}
                        </p>
                    )}
                    {client.address && (
                        <p className="text-sm text-foreground-muted whitespace-pre-wrap">{client.address}</p>
                    )}
                    {additionalInfo && (
                        <p className="text-sm text-foreground-muted whitespace-pre-wrap leading-relaxed">
                            {formatDocumentAdditionalInfo(additionalInfo)}
                        </p>
                    )}
                    {missingEmail ? (
                        <p className="text-sm text-foreground-muted">
                            No email on file.{' '}
                            <button
                                type="button"
                                className="font-medium text-brand hover:underline"
                                onClick={onEditClient}
                            >
                                Edit client
                            </button>
                        </p>
                    ) : null}
                </div>
            ) : (
                <p className="text-foreground-muted text-sm">Client not found</p>
            )}
        </FormSection>
    );
}

