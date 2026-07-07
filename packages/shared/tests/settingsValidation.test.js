import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { needsBusinessSetup } from '../src/settingsValidation.js';

describe('needsBusinessSetup', () => {
    it('returns true when required profile fields are missing', () => {
        assert.equal(
            needsBusinessSetup({
                name: 'Acme Ltd',
                email: 'hello@acme.com',
            }),
            true
        );
    });

    it('returns false when required profile fields are present', () => {
        assert.equal(
            needsBusinessSetup({
                name: 'Acme Ltd',
                address: '12 Market Street',
                email: 'hello@acme.com',
                phone: '08012345678',
            }),
            false
        );
    });
});
