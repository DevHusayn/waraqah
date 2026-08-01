export const PREMIUM_PRICE_NGN = 2000;
export const PREMIUM_LIST_PRICE_NGN = 5000;
export const PREMIUM_PRICE_YEARLY_NGN = 20000;
export const PREMIUM_LIST_PRICE_YEARLY_NGN = 24000;
export const PREMIUM_YEARLY_SAVINGS_NGN = 4000;
export const PREMIUM_LAUNCH_LABEL = 'Launch price';

export const BILLING_INTERVALS = ['monthly', 'yearly'];

export function formatPremiumPrice(amount) {
    return Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

export function premiumPriceLabel(amount = PREMIUM_PRICE_NGN) {
    return `₦${formatPremiumPrice(amount)}`;
}

export function premiumYearlyPriceLabel(amount = PREMIUM_PRICE_YEARLY_NGN) {
    return `₦${formatPremiumPrice(amount)}`;
}

export function premiumUpgradeLabel(amount = PREMIUM_PRICE_NGN, interval = 'monthly') {
    if (interval === 'yearly') {
        const yearlyAmount = amount ?? PREMIUM_PRICE_YEARLY_NGN;
        return `Upgrade — ${premiumYearlyPriceLabel(yearlyAmount)}/yr`;
    }
    return `Upgrade — ${premiumPriceLabel(amount)}/mo`;
}

export function premiumIntervalSuffix(interval = 'monthly') {
    return interval === 'yearly' ? '/year' : '/month';
}
