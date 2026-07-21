/**
 * Ensures a client record exists for invoice form data and returns its id.
 * Mirrors web `src/utils/ensureInvoiceClient.js`.
 */
export async function ensureInvoiceClient(
    { clientId, clientName, clientEmail },
    clients,
    { addClient, updateClient }
) {
    const name = String(clientName || '').trim();
    const email = String(clientEmail || '').trim();

    if (!name && !clientId) return null;

    if (clientId) {
        const existing = clients.find((c) => c.id === clientId);
        if (existing) {
            const needsUpdate = existing.name !== name || (existing.email || '') !== email;
            if (needsUpdate && name) {
                await updateClient(clientId, {
                    name,
                    email,
                    business: existing.business || existing.company || '',
                    phone: existing.phone || '',
                    address: existing.address || '',
                });
            }
            return clientId;
        }
    }

    if (!name) return null;

    const match = clients.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
    if (match) {
        if ((match.email || '') !== email) {
            await updateClient(match.id, {
                name: match.name,
                email,
                business: match.business || match.company || '',
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
