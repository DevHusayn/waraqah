/** Client business name — API uses `business`; legacy data may use `company`. */
export function getClientBusiness(client) {
    if (!client) return '';
    return client.business || client.company || '';
}
