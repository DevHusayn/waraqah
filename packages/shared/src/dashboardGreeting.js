export const DASHBOARD_VISIT_STORAGE_KEY = 'waraqah_dashboard_visited';
export const DEFAULT_BUSINESS_DISPLAY_NAME = 'Your business';

export function getDisplayBusinessName(businessInfo) {
    const name = businessInfo?.name?.trim();
    return name || DEFAULT_BUSINESS_DISPLAY_NAME;
}

export function resolveDashboardGreetingPhrase(hasVisitedBefore) {
    return hasVisitedBefore ? 'Welcome back' : 'Welcome';
}
