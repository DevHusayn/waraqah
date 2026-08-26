import test from 'node:test';
import assert from 'node:assert/strict';
import {
    applyAiDraftToForm,
    isAiDocumentType,
    AI_DOCUMENT_TYPES,
    isAiDraftsEnabled,
} from '../src/aiDraft.js';

test('AI document drafts are hidden until explicitly re-enabled', () => {
    assert.equal(isAiDraftsEnabled(), false);
});

test('isAiDocumentType accepts invoice and quotation only', () => {
    assert.equal(isAiDocumentType(AI_DOCUMENT_TYPES.INVOICE), true);
    assert.equal(isAiDocumentType('quotation'), true);
    assert.equal(isAiDocumentType('receipt'), false);
    assert.equal(isAiDocumentType('chat'), false);
});

test('applyAiDraftToForm prefills items, client, and notes without dropping other fields', () => {
    const prev = {
        invoiceNumber: '',
        clientId: '',
        clientName: '',
        notes: '',
        taxRate: 7.5,
        items: [{ description: '', quantity: 1, rate: 0, unit: 'Qty' }],
    };
    const next = applyAiDraftToForm(prev, {
        client: {
            clientId: 'c1',
            clientName: 'Ahmed',
            clientEmail: 'ahmed@example.com',
            clientBusiness: 'Ahmed Stores',
        },
        items: [{ description: 'Cement', quantity: 3, rate: 8500, unit: 'Bags', productId: 'p1' }],
        notes: 'Thank you',
    });

    assert.equal(next.taxRate, 7.5);
    assert.equal(next.clientId, 'c1');
    assert.equal(next.clientName, 'Ahmed');
    assert.equal(next.clientEmail, 'ahmed@example.com');
    assert.equal(next.items.length, 1);
    assert.equal(next.items[0].productId, 'p1');
    assert.equal(next.items[0].rate, 8500);
    assert.equal(next.notes, 'Thank you');
});

test('applyAiDraftToForm can stringify numbers for mobile inputs', () => {
    const next = applyAiDraftToForm(
        { items: [] },
        { items: [{ description: 'Nails', quantity: 2, rate: 500, unit: 'Boxes' }] },
        { stringifyNumbers: true }
    );
    assert.equal(next.items[0].quantity, '2');
    assert.equal(next.items[0].rate, '500');
});

test('applyAiDraftToForm ignores empty drafts', () => {
    const prev = { clientName: 'Ada', items: [] };
    assert.equal(applyAiDraftToForm(prev, null), prev);
    assert.deepEqual(applyAiDraftToForm(prev, {}), prev);
});
