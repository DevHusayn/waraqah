import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'waraqah_token';
const ADMIN_KEY = 'waraqah_is_admin';

export async function getToken() {
    try {
        return (await SecureStore.getItemAsync(TOKEN_KEY)) || '';
    } catch {
        return '';
    }
}

export async function setToken(token) {
    if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
}

export async function getIsAdmin() {
    try {
        return (await SecureStore.getItemAsync(ADMIN_KEY)) === '1';
    } catch {
        return false;
    }
}

export async function setIsAdmin(isAdmin) {
    if (isAdmin) {
        await SecureStore.setItemAsync(ADMIN_KEY, '1');
    } else {
        await SecureStore.deleteItemAsync(ADMIN_KEY);
    }
}

export async function clearAuth() {
    await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {}),
        SecureStore.deleteItemAsync(ADMIN_KEY).catch(() => {}),
    ]);
}
