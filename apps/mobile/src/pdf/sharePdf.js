import React from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getPdfFileName } from '@waraqah/shared';

function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const sub = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, sub);
    }
    if (typeof globalThis.btoa === 'function') {
        return globalThis.btoa(binary);
    }
    throw new Error('Base64 encoding unavailable');
}

export async function sharePdfDocument(documentElement, filename) {
    const { pdf } = await import('@react-pdf/renderer');
    const instance = pdf(documentElement);
    const buffer = await instance.toBuffer();
    const base64 = bufferToBase64(buffer);
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
            mimeType: 'application/pdf',
            dialogTitle: filename,
            UTI: 'com.adobe.pdf',
        });
    }
    return path;
}

export async function shareInvoicePdf(invoice, client, businessInfo, mode = 'auto') {
    const { InvoicePdfDocument } = await import('./InvoicePdfDocument');
    const filename = getPdfFileName(invoice, mode);
    return sharePdfDocument(
        <InvoicePdfDocument invoice={invoice} client={client} businessInfo={businessInfo} mode={mode} />,
        filename
    );
}

export async function shareStatementPdf(statement, businessInfo) {
    const { StatementPdfDocument } = await import('./StatementPdfDocument');
    const slug = statement.periodLabel.replace(/\s+/g, '-').toLowerCase();
    const filename = `monthly-statement-${slug}.pdf`;
    return sharePdfDocument(
        <StatementPdfDocument statement={statement} businessInfo={businessInfo} />,
        filename
    );
}
