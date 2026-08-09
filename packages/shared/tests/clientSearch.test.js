import test from 'node:test';
import assert from 'node:assert/strict';
import { filterClientsForSuggestion } from '../src/clientHelpers.js';

const clients = [
    { id: '1', name: 'Abdul Rahman', company: 'Acme Ltd', email: 'abdul@example.com' },
    { id: '2', name: 'Abdullah', email: 'adelokun@gmail.com' },
    { id: '3', name: 'Adeleja Ventures', company: 'Retail', email: '' },
    { id: '4', name: 'Zed Corp', email: 'zed@example.com' },
];

test('filterClientsForSuggestion prefers name prefix matches', () => {
    const results = filterClientsForSuggestion(clients, 'abd');
    assert.deepEqual(
        results.map((client) => client.id),
        ['1', '2']
    );
});

test('filterClientsForSuggestion matches company and email', () => {
    const results = filterClientsForSuggestion(clients, 'adelokun');
    assert.deepEqual(results.map((client) => client.id), ['2']);
});

test('filterClientsForSuggestion returns empty for blank query', () => {
    assert.deepEqual(filterClientsForSuggestion(clients, ''), []);
    assert.deepEqual(filterClientsForSuggestion(clients, '   '), []);
});

test('filterClientsForSuggestion respects limit', () => {
    const results = filterClientsForSuggestion(clients, 'a', { limit: 2 });
    assert.equal(results.length, 2);
});
