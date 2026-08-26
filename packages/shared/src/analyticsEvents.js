/** Shared PostHog event names — keep web and mobile in sync. */

export const ANALYTICS_EVENTS = {
    USER_SIGNED_UP: 'user_signed_up',
    USER_LOGGED_IN: 'user_logged_in',
    INVOICE_CREATED: 'invoice_created',
    QUOTATION_CREATED: 'quotation_created',
    RECEIPT_CREATED: 'receipt_created',
    PDF_DOWNLOADED: 'pdf_downloaded',
    UPGRADE_STARTED: 'upgrade_started',
    UPGRADE_COMPLETED: 'upgrade_completed',
    AI_DRAFT_STARTED: 'ai_draft_started',
    AI_DRAFT_APPLIED: 'ai_draft_applied',
};

export const ANALYTICS_PLATFORMS = {
    WEB: 'web',
    MOBILE: 'mobile',
};

export const PDF_DOCUMENT_TYPES = {
    INVOICE: 'invoice',
    QUOTATION: 'quotation',
    RECEIPT: 'receipt',
    STATEMENT: 'statement',
};

export const PDF_ACTIONS = {
    DOWNLOAD: 'download',
    SHARE: 'share',
};
