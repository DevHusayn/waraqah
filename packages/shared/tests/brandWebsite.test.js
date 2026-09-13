import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatWebsiteLabel, getAppDomain } from '../src/brandWebsite.js';

test('formatWebsiteLabel strips protocol and trailing slash', () => {
    assert.equal(formatWebsiteLabel('https://mybusiness.com/'), 'mybusiness.com');
    assert.equal(formatWebsiteLabel('http://shop.example.com'), 'shop.example.com');
    assert.equal(formatWebsiteLabel('mybusiness.com'), 'mybusiness.com');
});

test('formatWebsiteLabel is empty when website is missing', () => {
    assert.equal(formatWebsiteLabel(''), '');
    assert.equal(formatWebsiteLabel('   '), '');
    assert.equal(formatWebsiteLabel(undefined), '');
});

test('getAppDomain still returns the product hostname', () => {
    assert.equal(getAppDomain('https://mywaraqah.com/'), 'mywaraqah.com');
});
