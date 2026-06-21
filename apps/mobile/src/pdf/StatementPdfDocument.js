import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { getCurrencySymbol } from '@waraqah/shared';

const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    subtitle: { color: '#64748b', marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 6 },
    head: { backgroundColor: '#0284c7', color: '#fff', fontWeight: 'bold' },
    cell: { flex: 1, paddingHorizontal: 4 },
    footer: { marginTop: 24, fontSize: 8, color: '#64748b', textAlign: 'center' },
});

function money(value, symbol) {
    return `${symbol} ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StatementPdfDocument({ statement, businessInfo }) {
    const symbol = getCurrencySymbol(false);
    const brand = businessInfo?.brandColor || '#0284c7';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>{businessInfo?.name || 'Business'}</Text>
                <Text style={styles.subtitle}>Monthly billing statement — {statement.periodLabel}</Text>
                <Text style={styles.subtitle}>
                    Generated: {format(statement.generatedAt, 'MMM d, yyyy')}
                </Text>

                <Text style={styles.sectionTitle}>Summary</Text>
                {[
                    ['Paid', statement.totals.paid],
                    ['Pending', statement.totals.pending],
                    ['Overdue', statement.totals.overdue],
                    ['Cancelled', statement.totals.cancelled],
                    ['Total billed', statement.totals.total],
                ].map(([label, val]) => (
                    <View key={label} style={styles.row}>
                        <Text style={{ flex: 1 }}>{label}</Text>
                        <Text>{money(val, symbol)}</Text>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>By client</Text>
                <View style={[styles.row, styles.head, { backgroundColor: brand }]}>
                    <Text style={styles.cell}>Client</Text>
                    <Text style={styles.cell}>Paid</Text>
                    <Text style={styles.cell}>Pending</Text>
                    <Text style={styles.cell}>Total</Text>
                </View>
                {statement.rows.map((row) => (
                    <View key={row.clientId} style={styles.row}>
                        <Text style={styles.cell}>{row.clientName}</Text>
                        <Text style={styles.cell}>{money(row.paid, symbol)}</Text>
                        <Text style={styles.cell}>{money(row.pending, symbol)}</Text>
                        <Text style={styles.cell}>{money(row.total, symbol)}</Text>
                    </View>
                ))}

                <Text style={styles.footer}>
                    Amounts grouped by invoice status for {statement.periodLabel}.
                </Text>
            </Page>
        </Document>
    );
}
