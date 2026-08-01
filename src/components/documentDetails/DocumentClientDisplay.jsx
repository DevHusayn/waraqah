import { User, Mail, Phone, Building2 } from 'lucide-react';
import FormSection from '../FormSection';
import { getClientBusiness } from '../../utils/clientHelpers';

export default function DocumentClientDisplay({ client, additionalInfo }) {
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
                    {client.email && (
                        <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                            <Mail size={14} className="text-zinc-400" aria-hidden />
                            {client.email}
                        </p>
                    )}
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
                </div>
            ) : (
                <p className="text-zinc-500 text-sm">Client not found</p>
            )}
        </FormSection>
    );
}
