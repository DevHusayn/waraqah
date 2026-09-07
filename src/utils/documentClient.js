import { apiFetch } from './api';

export function normalizeDocumentClientId(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'object') {
        const id = value._id || value.id;
        return id ? String(id) : null;
    }
    return String(value);
}

export function findClientInList(clients, clientId) {
    const id = normalizeDocumentClientId(clientId);
    if (!id || !Array.isArray(clients)) return null;
    return clients.find((c) => String(c.id) === id || String(c._id) === id) || null;
}

export function snapshotClientFromDocument(doc) {
    const name = String(doc?.clientName || '').trim();
    const company = String(doc?.clientCompany || '').trim();
    if (!name && !company) return null;
    return {
        id: null,
        name,
        company,
        email: '',
        phone: '',
        address: '',
    };
}

export async function fetchClientById(clientId) {
    const id = normalizeDocumentClientId(clientId);
    if (!id) return null;
    try {
        const data = await apiFetch(`/clients/${id}`);
        return { ...data, id: data._id || data.id };
    } catch {
        return null;
    }
}

export async function resolveFormClient(doc, clients) {
    const fromList = findClientInList(clients, doc?.clientId);
    if (fromList) return fromList;
    const fetched = await fetchClientById(doc?.clientId);
    if (fetched) return fetched;
    return snapshotClientFromDocument(doc);
}

export function resolveDisplayClient({
    clients = [],
    clientId,
    clientName,
    clientCompany,
    liveClient = null,
    clientOverride = null,
} = {}) {
    const fromList = findClientInList(clients, clientId);
    const snapshot = snapshotClientFromDocument({ clientName, clientCompany });
    const live = liveClient || fromList;
    if (!clientOverride && !live && !snapshot) return null;

    return {
        ...(snapshot || {}),
        ...(fromList || {}),
        ...(liveClient || {}),
        ...(clientOverride || {}),
        id: normalizeDocumentClientId(clientOverride?.id || live?.id || liveClient?.id || fromList?.id),
        name:
            clientOverride?.name
            || liveClient?.name
            || fromList?.name
            || snapshot?.name
            || '',
        company:
            clientOverride?.company
            || liveClient?.company
            || fromList?.company
            || snapshot?.company
            || '',
    };
}
