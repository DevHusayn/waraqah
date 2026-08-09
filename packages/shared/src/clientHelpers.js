export function getClientBusiness(client) {
    if (!client) return '';
    return client.business || client.company || '';
}

function normalizeSearchText(value) {
    return String(value || '').trim().toLowerCase();
}

function clientSearchHaystack(client) {
    return [
        client?.name,
        getClientBusiness(client),
        client?.email,
        client?.phone,
    ]
        .map(normalizeSearchText)
        .filter(Boolean)
        .join(' ');
}

function clientMatchScore(client, query) {
    const q = normalizeSearchText(query);
    if (!q) return -1;

    const name = normalizeSearchText(client?.name);
    const haystack = clientSearchHaystack(client);

    if (name.startsWith(q)) return 0;
    if (name.includes(q)) return 1;
    if (haystack.includes(q)) return 2;
    return -1;
}

/** Filter saved clients for name-field autocomplete suggestions. */
export function filterClientsForSuggestion(clients, query, { limit = 8 } = {}) {
    const q = normalizeSearchText(query);
    if (!q || !Array.isArray(clients)) return [];

    return clients
        .map((client) => ({ client, score: clientMatchScore(client, q) }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => {
            if (a.score !== b.score) return a.score - b.score;
            return normalizeSearchText(a.client?.name).localeCompare(
                normalizeSearchText(b.client?.name)
            );
        })
        .slice(0, Math.max(1, limit))
        .map(({ client }) => client);
}
