import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getDefaultDocumentFooter,
    resolveDocumentFooter,
} from '../src/documentFooter.js';

test('getDefaultDocumentFooter returns invoice/receipt thank-you', () => {
    assert.equal(
        getDefaultDocumentFooter('Elhusayn', 'invoice'),
        'Thank you for doing business with Elhusayn.'
    );
    assert.equal(
        getDefaultDocumentFooter('Elhusayn', 'receipt'),
        'Thank you for doing business with Elhusayn.'
    );
});

test('getDefaultDocumentFooter returns quotation thank-you', () => {
    assert.equal(
        getDefaultDocumentFooter('Elhusayn', 'quotation'),
        'Thank you for considering Elhusayn. We look forward to doing business with you.'
    );
});

test('getDefaultDocumentFooter falls back when name is empty', () => {
    assert.equal(
        getDefaultDocumentFooter('', 'invoice'),
        'Thank you for doing business with us.'
    );
});

test('resolveDocumentFooter prefers custom documentFooter', () => {
    assert.equal(
        resolveDocumentFooter(
            { documentFooter: '  Custom message.  ' },
            { name: 'Elhusayn' },
            'invoice'
        ),
        'Custom message.'
    );
});

test('resolveDocumentFooter falls back to default', () => {
    assert.equal(
        resolveDocumentFooter({}, { name: 'Elhusayn' }, 'quotation'),
        'Thank you for considering Elhusayn. We look forward to doing business with you.'
    );
});
