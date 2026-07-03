import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isStrongPassword,
    getPasswordStrength,
    PASSWORD_REQUIREMENTS_MESSAGE,
} from '../src/passwordValidation.js';

test('isStrongPassword accepts valid passwords', () => {
    assert.equal(isStrongPassword('Password1'), true);
    assert.equal(isStrongPassword('MySecure9'), true);
});

test('isStrongPassword rejects weak passwords', () => {
    assert.equal(isStrongPassword('password'), false);
    assert.equal(isStrongPassword('PASSWORD1'), false);
    assert.equal(isStrongPassword('Pass1'), false);
    assert.equal(isStrongPassword(''), false);
});

test('getPasswordStrength returns strong for valid passwords', () => {
    const result = getPasswordStrength('Password1');

    assert.equal(result.level, 'strong');
    assert.equal(result.percent, 100);
});

test('getPasswordStrength returns empty for missing password', () => {
    const result = getPasswordStrength('');

    assert.equal(result.level, 'empty');
    assert.equal(result.percent, 0);
});

test('PASSWORD_REQUIREMENTS_MESSAGE is defined', () => {
    assert.match(PASSWORD_REQUIREMENTS_MESSAGE, /8 characters/i);
});
