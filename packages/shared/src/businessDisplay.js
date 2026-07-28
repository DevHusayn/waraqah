export const DEFAULT_BUSINESS_DISPLAY_NAME = 'Your business';
export const DASHBOARD_SUBTITLE = 'Your business at a glance';

export function getDisplayBusinessName(businessInfo) {
    const name = businessInfo?.name?.trim();
    return name || DEFAULT_BUSINESS_DISPLAY_NAME;
}
