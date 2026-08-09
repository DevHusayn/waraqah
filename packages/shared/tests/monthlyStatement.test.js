import test from 'node:test';
import assert from 'node:assert/strict';
import {
    allocateStatementAmounts,
    buildMonthlyStatement,
} from '../src/monthlyStatement.js';

test('allocateStatementAmounts puts fully paid receipt total in paid', () => {
    assert.deepEqual(
        allocateStatementAmounts({
            documentType: 'receipt',
            status: 'paid',
            total: 1000,
            amountPaid: 1000,
        }),
        { paid: 1000, partial: 0, pending: 0, overdue: 0, cancelled: 0 }
    );
});

test('allocateStatementAmounts splits part received receipt between paid and partial', () => {
    assert.deepEqual(
        allocateStatementAmounts({
            documentType: 'receipt',
            status: 'paid',
            total: 1000,
            amountPaid: 400,
        }),
        { paid: 400, partial: 600, pending: 0, overdue: 0, cancelled: 0 }
    );
});

test('allocateStatementAmounts splits partial invoice between paid and partial', () => {
    assert.deepEqual(
        allocateStatementAmounts({
            documentType: 'invoice',
            status: 'partial',
            total: 5000,
            amountPaid: 2000,
        }),
        { paid: 2000, partial: 3000, pending: 0, overdue: 0, cancelled: 0 }
    );
});

test('buildMonthlyStatement includes receipts and invoices with partial bucket', () => {
    const statement = buildMonthlyStatement({
        year: 2026,
        month: 2,
        clients: [{ id: 'c1', name: 'Acme Co' }],
        invoices: [
            {
                clientId: 'c1',
                date: '2026-02-05',
                status: 'partial',
                total: 5000,
                amountPaid: 2000,
                documentType: 'invoice',
            },
        ],
        receipts: [
            {
                clientId: 'c1',
                date: '2026-02-10',
                status: 'paid',
                total: 1000,
                amountPaid: 400,
                documentType: 'receipt',
            },
            {
                clientId: 'c1',
                date: '2026-02-12',
                status: 'paid',
                total: 800,
                amountPaid: 800,
                documentType: 'receipt',
            },
        ],
    });

    assert.equal(statement.totals.paid, 3200);
    assert.equal(statement.totals.partial, 3600);
    assert.equal(statement.totals.total, 6800);
    assert.equal(statement.totals.documentCount, 3);
    assert.equal(statement.rows[0].partial, 3600);
    assert.equal(statement.rows[0].paid, 3200);
});

test('buildMonthlyStatement excludes draft documents', () => {
    const statement = buildMonthlyStatement({
        year: 2026,
        month: 2,
        clients: [{ id: 'c1', name: 'Acme Co' }],
        invoices: [
            {
                clientId: 'c1',
                date: '2026-02-05',
                status: 'draft',
                total: 5000,
                documentType: 'invoice',
            },
        ],
        receipts: [],
    });

    assert.equal(statement.hasData, false);
    assert.equal(statement.totals.documentCount, 0);
});
