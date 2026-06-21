export function getClientBusiness(client) {
    if (!client) return '';
    return client.business || client.company || '';
}
