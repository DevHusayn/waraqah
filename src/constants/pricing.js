/** Premium subscription pricing (NGN) */
export const PREMIUM_PRICE_NGN = 2000;
export const PREMIUM_LIST_PRICE_NGN = 5000;
export const PREMIUM_LAUNCH_LABEL = 'Launch price';

export function formatPremiumPrice(amount) {
    return Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

export function premiumPriceLabel(amount = PREMIUM_PRICE_NGN) {
    return `₦${formatPremiumPrice(amount)}`;
}

export function premiumUpgradeLabel(amount = PREMIUM_PRICE_NGN) {
    return `Upgrade — ${premiumPriceLabel(amount)}/mo`;
}
