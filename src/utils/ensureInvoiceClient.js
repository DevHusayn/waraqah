/**
 * Ensures a client record exists for invoice form data and returns its id.
 * Creates a new client, or updates an existing one when name/email changed inline.
 */
export async function ensureInvoiceClient(
    { clientId, clientName, clientEmail },
    clients,
    { addClient, updateClient }
) {
    const name = String(clientName || '').trim();
    const email = String(clientEmail || '').trim();

    if (clientId) {
        const existing = clients.find((c) => c.id === clientId);
        if (existing) {
            const needsUpdate = existing.name !== name || (existing.email || '') !== email;
            if (needsUpdate) {
                await updateClient(clientId, {
                    name,
                    email,
                    business: existing.business || '',
                    phone: existing.phone || '',
                    address: existing.address || '',
                });
            }
            return clientId;
        }
    }

    const match = clients.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
    if (match) {
        if ((match.email || '') !== email) {
            await updateClient(match.id, {
                name: match.name,
                email,
                business: match.business || '',
                phone: match.phone || '',
                address: match.address || '',
            });
        }
        return match.id;
    }

    const newClient = await addClient({
        name,
        email,
        business: '',
        phone: '',
        address: '',
    });
    return newClient.id;
}
