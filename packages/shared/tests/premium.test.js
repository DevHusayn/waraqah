import test from 'node:test';
import assert from 'node:assert/strict';
import {
    canCancelPremiumAutoRenewal,
    isPremiumAutoRenewing,
    isPremiumUser,
} from '../src/premium.js';

const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

test('canCancelPremiumAutoRenewal is true after a paid checkout even without a SUB_ code', () => {
    assert.equal(
        canCancelPremiumAutoRenewal({
            plan: 'premium',
            premiumUntil: future,
            billingInterval: 'monthly',
            paystackSubscriptionCode: '',
            subscriptionStatus: null,
        }),
        true,
    );
});

test('canCancelPremiumAutoRenewal stays true when the Paystack subscription is linked', () => {
    assert.equal(
        canCancelPremiumAutoRenewal({
            plan: 'premium',
            premiumUntil: future,
            billingInterval: 'monthly',
            paystackSubscriptionCode: 'SUB_123',
            subscriptionStatus: 'active',
        }),
        true,
    );
});

test('canCancelPremiumAutoRenewal is false after cancel or for complimentary premium', () => {
    assert.equal(
        canCancelPremiumAutoRenewal({
            plan: 'premium',
            premiumUntil: future,
            billingInterval: 'monthly',
            paystackSubscriptionCode: 'SUB_123',
            subscriptionStatus: 'cancelled',
        }),
        false,
    );
    assert.equal(
        canCancelPremiumAutoRenewal({
            plan: 'premium',
            premiumUntil: future,
            billingInterval: null,
            paystackSubscriptionCode: '',
            subscriptionStatus: null,
        }),
        false,
    );
});

test('isPremiumAutoRenewing treats a paid interval as renewing before the SUB_ code lands', () => {
    assert.equal(
        isPremiumAutoRenewing({
            plan: 'premium',
            premiumUntil: future,
            billingInterval: 'monthly',
            paystackSubscriptionCode: '',
            subscriptionStatus: null,
        }),
        true,
    );
    assert.equal(
        isPremiumAutoRenewing({
            plan: 'premium',
            premiumUntil: future,
            billingInterval: 'monthly',
            paystackSubscriptionCode: 'SUB_123',
            subscriptionStatus: 'cancelled',
        }),
        false,
    );
    assert.equal(isPremiumUser({ plan: 'premium', premiumUntil: future }), true);
});
