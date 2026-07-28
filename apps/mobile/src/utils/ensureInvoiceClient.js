import { getClientBusiness } from '@waraqah/shared';

function normalizeClientDetails({ clientBusiness, clientPhone, clientAddress }) {
    return {
        business: String(clientBusiness || '').trim(),
        phone: String(clientPhone || '').trim(),
        address: String(clientAddress || '').trim(),
    };
}

function clientDetailsFromRecord(client) {
    if (!client) {
        return {
            clientBusiness: '',
            clientPhone: '',
            clientAddress: '',
        };
    }
    return {
        clientBusiness: getClientBusiness(client),
        clientPhone: client.phone || '',
        clientAddress: client.address || '',
    };
}

function clientDetailsMatch(existing, details) {
    const business = getClientBusiness(existing);
    return (
        (existing.name || '') === details.name &&
        (existing.email || '') === details.email &&
        business === details.business &&
        (existing.phone || '') === details.phone &&
        (existing.address || '') === details.address
    );
}

/**
 * Ensures a client record exists for invoice form data and returns its id.
 * Note: clientAdditionalInfo is document-specific and is not stored on the client.
 */
export async function ensureInvoiceClient(
    { clientId, clientName, clientEmail, clientBusiness, clientPhone, clientAddress },
    clients,
    { addClient, updateClient }
) {
    const name = String(clientName || '').trim();
    const email = String(clientEmail || '').trim();
    const details = normalizeClientDetails({ clientBusiness, clientPhone, clientAddress });
    const payload = { name, email, ...details };

    if (!name && !clientId) return null;

    if (clientId) {
        const existing = clients.find((c) => c.id === clientId);
        if (existing) {
            if (!clientDetailsMatch(existing, payload)) {
                await updateClient(clientId, payload);
            }
            return clientId;
        }
    }

    if (!name) return null;

    const match = clients.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
    if (match) {
        if (!clientDetailsMatch(match, payload)) {
            await updateClient(match.id, {
                name: match.name,
                ...payload,
            });
        }
        return match.id;
    }

    const newClient = await addClient(payload);
    return newClient.id;
}

export { clientDetailsFromRecord, normalizeClientDetails };
