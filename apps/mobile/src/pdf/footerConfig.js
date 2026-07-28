import { isPremiumUser } from '@waraqah/shared';

export function buildDocumentFooterConfig(businessInfo, mode = 'invoice') {
    return {
        premium: isPremiumUser(businessInfo),
        mode,
        businessName: businessInfo?.name || 'us',
        brandColor: businessInfo?.brandColor || '#16A34A',
    };
}

export function buildStatementFooterConfig(statement, businessInfo) {
    return {
        type: 'statement',
        periodLabel: statement.periodLabel,
        businessName: businessInfo?.name || '',
        businessEmail: businessInfo?.email || '',
        brandColor: businessInfo?.brandColor || '#16A34A',
    };
}
