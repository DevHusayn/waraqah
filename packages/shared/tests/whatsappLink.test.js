import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildAdminWhatsAppOnboardingMessage,
    getCallingCode,
    toWhatsAppUrl,
} from '../src/whatsappLink.js';

test('toWhatsAppUrl returns null for empty or junk input', () => {
    assert.equal(toWhatsAppUrl(), null);
    assert.equal(toWhatsAppUrl(''), null);
    assert.equal(toWhatsAppUrl('   '), null);
    assert.equal(toWhatsAppUrl('n/a'), null);
    assert.equal(toWhatsAppUrl('---'), null);
    assert.equal(toWhatsAppUrl('123'), null);
});

test('toWhatsAppUrl converts Nigerian local numbers using default country', () => {
    assert.equal(toWhatsAppUrl('08031234567'), 'https://wa.me/2348031234567');
    assert.equal(toWhatsAppUrl('0803 123 4567'), 'https://wa.me/2348031234567');
    assert.equal(toWhatsAppUrl('(0803) 123-4567'), 'https://wa.me/2348031234567');
});

test('toWhatsAppUrl uses business country calling code for local numbers', () => {
    assert.equal(toWhatsAppUrl('08031234567', 'GH'), 'https://wa.me/2338031234567');
    assert.equal(toWhatsAppUrl('0791234567', 'ZA'), 'https://wa.me/27791234567');
});

test('toWhatsAppUrl keeps international numbers as digits only', () => {
    assert.equal(toWhatsAppUrl('+234 803 123 4567'), 'https://wa.me/2348031234567');
    assert.equal(toWhatsAppUrl('002348031234567'), 'https://wa.me/2348031234567');
    assert.equal(toWhatsAppUrl('2348031234567'), 'https://wa.me/2348031234567');
});

test('toWhatsAppUrl defaults unknown country calling code to Nigeria', () => {
    assert.equal(getCallingCode('XX'), '234');
    assert.equal(toWhatsAppUrl('08031234567', 'XX'), 'https://wa.me/2348031234567');
});

test('buildAdminWhatsAppOnboardingMessage greets the business name', () => {
    const message = buildAdminWhatsAppOnboardingMessage('Pure Radiance Glow');
    assert.match(message, /^Hi Pure Radiance Glow,/);
    assert.match(message, /Team Waraqah$/);
    assert.match(message, /recently registered on Waraqah/);
});

test('toWhatsAppUrl appends encoded onboarding message', () => {
    const message = buildAdminWhatsAppOnboardingMessage('SAMIF');
    const url = toWhatsAppUrl('08031234567', 'NG', message);
    assert.ok(url.startsWith('https://wa.me/2348031234567?text='));
    assert.equal(decodeURIComponent(url.split('?text=')[1]), message);
});
