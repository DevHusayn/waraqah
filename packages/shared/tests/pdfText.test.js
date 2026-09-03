import test from 'node:test';
import assert from 'node:assert/strict';
import {
    breakLabeledFields,
    breakInlineListMarkers,
    toPdfSafeText,
    preparePdfAdditionalInfo,
    preparePdfItemDescription,
} from '../src/pdfText.js';

test('breakLabeledFields puts each label on its own line', () => {
    const input =
        'Attention: Adaeze Okonkwo Name of Contact: Greenfield Properties Project Type: Retainer';
    assert.equal(
        breakLabeledFields(input),
        [
            'Attention: Adaeze Okonkwo',
            'Name of Contact: Greenfield Properties',
            'Project Type: Retainer',
        ].join('\n')
    );
});

test('breakInlineListMarkers splits apostrophe-delimited items', () => {
    const input =
        "Website redesign: ' Brand workshop ' UI mockups ' Developer handoff";
    assert.equal(
        breakInlineListMarkers(input),
        [
            'Website redesign:',
            '- Brand workshop',
            '- UI mockups',
            '- Developer handoff',
        ].join('\n')
    );
});

test('toPdfSafeText strips zero-width and smart punctuation that collapse Helvetica', () => {
    const input = 'Q1–Q2\u200band\u00a0Q3–Q4 • extras';
    assert.equal(toPdfSafeText(input), 'Q1-Q2and Q3-Q4 - extras');
});

test('preparePdfAdditionalInfo combines label breaks and PDF-safe characters', () => {
    const result = preparePdfAdditionalInfo(
        'Attention: Adaeze Name of Contact: Q1–Q2 review'
    );
    assert.equal(result, 'Attention: Adaeze\nName of Contact: Q1-Q2 review');
});

test('breakLabeledFields leaves already-separated lines and mid-sentence colons alone', () => {
    assert.equal(
        breakLabeledFields('Attention: Adaeze Okonkwo\nProject Type: Retainer'),
        'Attention: Adaeze Okonkwo\nProject Type: Retainer'
    );
    assert.equal(
        breakLabeledFields('Note: see section 4.2: details'),
        'Note: see section 4.2: details'
    );
});

test('preparePdfItemDescription is safe for empty values', () => {
    assert.equal(preparePdfItemDescription(''), '');
    assert.equal(preparePdfItemDescription(null), '');
});
