import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePublicPdfMode } from '../src/utils/publicInvoicePdf.js';

test('resolvePublicPdfMode maps receipt view to receipt mode', () => {
    assert.equal(resolvePublicPdfMode(true), 'receipt');
    assert.equal(resolvePublicPdfMode(false), 'invoice');
});
