import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import {
    getDocumentNumber,
    getPaymentMethodLabel,
    getCurrencySymbol,
    resolvePdfMode,
} from '@waraqah/shared';

const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
    topBar: { height: 4, backgroundColor: '#0284c7', marginBottom: 20, marginHorizontal: -32, marginTop: -32 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    businessName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    muted: { color: '#6b7280', marginTop: 2 },
    docTitle: { fontSize: 28, fontWeight: 'bold', color: '#0284c7' },
    docNumber: { marginTop: 6, padding: 6, backgroundColor: '#e0f2fe', borderRadius: 4, color: '#0284c7', fontWeight: 'bold' },
    infoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    infoBox: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 6, padding: 10 },
    infoLabel: { fontSize: 8, fontWeight: 'bold', color: '#0284c7', marginBottom: 4 },
    tableHead: { flexDirection: 'row', backgroundColor: '#0284c7', color: '#fff', padding: 8 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: 8 },
    colDesc: { width: '45%' },
    colQty: { width: '15%', textAlign: 'center' },
    colRate: { width: '20%', textAlign: 'center' },
    colAmt: { width: '20%', textAlign: 'center', fontWeight: 'bold' },
    totals: { marginTop: 12, marginLeft: 'auto', width: '45%' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    totalBold: { fontWeight: 'bold', fontSize: 11 },
    footer: { position: 'absolute', bottom: 32, left: 32, right: 32, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, textAlign: 'center', color: '#6b7280' },
});

function formatMoney(value, symbol) {
    return `${symbol} ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function InvoicePdfDocument({ invoice, client, businessInfo, mode = 'auto' }) {
    const resolvedMode = resolvePdfMode(invoice, mode);
    const isReceipt = resolvedMode === 'receipt';
    const brand = businessInfo?.brandColor || '#0284c7';
    const symbol = getCurrencySymbol(false);
    const docNumber = getDocumentNumber(invoice, resolvedMode);

    const dynamicStyles = StyleSheet.create({
        bar: { ...styles.topBar, backgroundColor: brand },
        head: { ...styles.tableHead, backgroundColor: brand },
        title: { ...styles.docTitle, color: brand },
        num: { ...styles.docNumber, backgroundColor: '#e0f2fe', color: brand },
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={dynamicStyles.bar} />
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.businessName}>{businessInfo?.name || 'Business'}</Text>
                        <Text style={styles.muted}>{businessInfo?.address}</Text>
                        <Text style={styles.muted}>{businessInfo?.email}</Text>
                        <Text style={styles.muted}>{businessInfo?.phone}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={dynamicStyles.title}>{isReceipt ? 'RECEIPT' : 'INVOICE'}</Text>
                        <Text style={dynamicStyles.num}>#{docNumber}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>BILLED TO</Text>
                        <Text style={{ fontWeight: 'bold' }}>{client?.name}</Text>
                        <Text style={styles.muted}>{client?.email}</Text>
                        {client?.phone ? <Text style={styles.muted}>{client.phone}</Text> : null}
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>ISSUE DATE</Text>
                        <Text>{invoice?.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'N/A'}</Text>
                        {isReceipt ? (
                            <>
                                <Text style={[styles.infoLabel, { marginTop: 6 }]}>PAYMENT METHOD</Text>
                                <Text>{getPaymentMethodLabel(invoice.paymentMethod)}</Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.infoLabel, { marginTop: 6 }]}>DUE DATE</Text>
                                <Text>
                                    {invoice?.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}
                                </Text>
                            </>
                        )}
                    </View>
                </View>
                <View style={dynamicStyles.head}>
                    <Text style={styles.colDesc}>DESCRIPTION</Text>
                    <Text style={styles.colQty}>QTY</Text>
                    <Text style={styles.colRate}>RATE</Text>
                    <Text style={styles.colAmt}>AMOUNT</Text>
                </View>
                {(invoice?.items || []).map((item, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colDesc}>{item.description}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={styles.colRate}>{formatMoney(item.rate, symbol)}</Text>
                        <Text style={styles.colAmt}>
                            {formatMoney(Number(item.quantity) * Number(item.rate), symbol)}
                        </Text>
                    </View>
                ))}
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text>Subtotal</Text>
                        <Text>{formatMoney(invoice.subtotal, symbol)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>Tax ({invoice.taxRate || 10}%)</Text>
                        <Text>{formatMoney(invoice.tax, symbol)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.totalBold]}>
                        <Text>Total</Text>
                        <Text>{formatMoney(invoice.total, symbol)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.totalBold, { color: brand }]}>
                        <Text>{isReceipt ? 'TOTAL PAID' : 'TOTAL DUE'}</Text>
                        <Text>{formatMoney(invoice.total, symbol)}</Text>
                    </View>
                </View>
                {invoice?.notes ? (
                    <View style={{ marginTop: 16 }}>
                        <Text style={{ fontWeight: 'bold', color: brand, marginBottom: 4 }}>NOTES</Text>
                        <Text style={styles.muted}>{invoice.notes}</Text>
                    </View>
                ) : null}
                <View style={styles.footer}>
                    <Text>{isReceipt ? 'Payment received. Thank you!' : 'Thank you for your business!'}</Text>
                    <Text style={{ fontSize: 8, marginTop: 4 }}>
                        {businessInfo?.name} • {businessInfo?.email} • {businessInfo?.phone}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
