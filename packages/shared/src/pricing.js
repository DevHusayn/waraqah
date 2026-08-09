export const PREMIUM_PRICE_NGN = 5000;
export const PREMIUM_PRICE_YEARLY_NGN = 50000;
export const PREMIUM_YEARLY_SAVINGS_NGN = PREMIUM_PRICE_NGN * 12 - PREMIUM_PRICE_YEARLY_NGN;

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
