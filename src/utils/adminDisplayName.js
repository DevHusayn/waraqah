export function adminDisplayName(user, businessInfo) {
    const fromApi = String(user?.displayName || '').trim();
    if (fromApi) return fromApi;
    const account = String(user?.name || '').trim();
    if (account) return account;
    return String(businessInfo?.name || user?.businessInfo?.name || '').trim();
}
