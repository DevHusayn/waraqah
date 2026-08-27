export const SIDEBAR_COLLAPSED_KEY = 'waraqah_sidebar_collapsed';

export function readSidebarCollapsed() {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
        return false;
    }
}

export function applySidebarCollapsed(collapsed) {
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
}

export function persistSidebarCollapsed(collapsed) {
    try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
        // ignore storage failures
    }
    applySidebarCollapsed(collapsed);
}
