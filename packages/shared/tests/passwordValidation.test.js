import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isStrongPassword,
    getPasswordStrength,
    PASSWORD_REQUIREMENTS_MESSAGE,
    SAME_PASSWORD_MESSAGE,
    CHANGE_PASSWORD_FIELD_ORDER,
    buildChangePasswordFieldErrors,
} from '../src/passwordValidation.js';
import { firstFieldError } from '../src/formFieldValidation.js';

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

test('buildChangePasswordFieldErrors requires current, new, and confirm', () => {
    const errors = buildChangePasswordFieldErrors({});

    assert.equal(firstFieldError(errors, CHANGE_PASSWORD_FIELD_ORDER), 'currentPassword');
    assert.match(errors.currentPassword, /current password/i);
    assert.match(errors.newPassword, /new password/i);
    assert.match(errors.confirmPassword, /confirm/i);
});

test('buildChangePasswordFieldErrors rejects a weak new password', () => {
    const errors = buildChangePasswordFieldErrors({
        currentPassword: 'Password1',
        newPassword: 'weak',
        confirmPassword: 'weak',
    });

    assert.equal(errors.newPassword, PASSWORD_REQUIREMENTS_MESSAGE);
});

test('buildChangePasswordFieldErrors rejects mismatched confirmation', () => {
    const errors = buildChangePasswordFieldErrors({
        currentPassword: 'Password1',
        newPassword: 'Password2',
        confirmPassword: 'Password3',
    });

    assert.match(errors.confirmPassword, /do not match/i);
});

test('buildChangePasswordFieldErrors rejects reusing the current password', () => {
    const errors = buildChangePasswordFieldErrors({
        currentPassword: 'Password1',
        newPassword: 'Password1',
        confirmPassword: 'Password1',
    });

    assert.equal(errors.newPassword, SAME_PASSWORD_MESSAGE);
});

test('buildChangePasswordFieldErrors accepts a valid change', () => {
    const errors = buildChangePasswordFieldErrors({
        currentPassword: 'Password1',
        newPassword: 'Password2',
        confirmPassword: 'Password2',
    });

    assert.equal(firstFieldError(errors, CHANGE_PASSWORD_FIELD_ORDER), null);
    assert.equal(errors.currentPassword, '');
    assert.equal(errors.newPassword, '');
    assert.equal(errors.confirmPassword, '');
});
