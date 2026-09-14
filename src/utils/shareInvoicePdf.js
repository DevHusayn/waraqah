import {
    getDocumentNumber,
    resolvePdfMode,
} from './receiptHelpers';
import {
    ANALYTICS_EVENTS,
    PDF_ACTIONS,
    PDF_DOCUMENT_TYPES,
} from '@waraqah/shared';
import { captureEvent } from '../monitoring/posthog';

function capturePdfDownloaded(documentType, action) {
    captureEvent(ANALYTICS_EVENTS.PDF_DOWNLOADED, {
        document_type: documentType,
        action,
    });
}

function documentTypeFromMode(mode) {
    if (mode === 'receipt') return PDF_DOCUMENT_TYPES.RECEIPT;
    if (mode === 'quotation') return PDF_DOCUMENT_TYPES.QUOTATION;
    return PDF_DOCUMENT_TYPES.INVOICE;
}

export function buildInvoiceShareMessage(invoice, client, businessInfo, mode = 'auto') {
    const resolvedMode = resolvePdfMode(invoice, mode);
    const docKind =
        resolvedMode === 'receipt'
            ? 'receipt'
            : resolvedMode === 'quotation'
              ? 'quotation'
              : 'invoice';
    const docNumber = getDocumentNumber(invoice, resolvedMode);
    const businessName = businessInfo?.name?.trim() || 'Our business';
    const clientName = client?.name?.trim() || 'there';

    return `Hi ${clientName}\n\nAttached is your ${docKind} ${docNumber}.\n\nThank you.\n${businessName}`;
}

export function canSharePdfFiles() {
    if (typeof navigator === 'undefined' || !navigator.share) return false;
    try {
        const probe = new File([''], 'probe.pdf', { type: 'application/pdf' });
        return navigator.canShare?.({ files: [probe] }) ?? false;
    } catch {
        return false;
    }
}

export function downloadPdfBlob(blob, filename, { documentType } = {}) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    if (documentType) {
        capturePdfDownloaded(documentType, PDF_ACTIONS.DOWNLOAD);
    }
}

function isMobileViewport() {
    if (typeof window === 'undefined') return false;
    const narrow = window.matchMedia('(max-width: 768px)').matches;
    const mobileUa = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    return narrow || mobileUa;
}

function revokeObjectUrlLater(url, delayMs = 60_000) {
    window.setTimeout(() => URL.revokeObjectURL(url), delayMs);
}

/**
 * Open a blank tab during the click gesture so mobile browsers allow it after
 * the PDF is generated. No-op on desktop (iframe print does not need a tab).
 */
export function preparePdfPrintTab() {
    if (typeof window === 'undefined' || !isMobileViewport()) return null;
    return window.open('about:blank', '_blank');
}

export function closePdfPrintTab(printWindow) {
    if (!printWindow || printWindow.closed) return;
    try {
        printWindow.close();
    } catch {
        // Ignore — some browsers block script-initiated close.
    }
}

function openPdfInTab(blob, filename, printWindow) {
    const url = URL.createObjectURL(blob);

    const showInWindow = (win) => {
        if (!win || win.closed) return false;
        try {
            win.location.href = url;
            win.focus();
            return true;
        } catch {
            return false;
        }
    };

    const tabUrlLifetimeMs = 10 * 60 * 1000;

    if (showInWindow(printWindow)) {
        revokeObjectUrlLater(url, tabUrlLifetimeMs);
        return Promise.resolve({ method: 'tab' });
    }

    const opened = window.open(url, '_blank');
    if (opened) {
        closePdfPrintTab(printWindow);
        try {
            opened.focus();
        } catch {
            // Ignore focus failures in background tabs.
        }
        revokeObjectUrlLater(url, tabUrlLifetimeMs);
        return Promise.resolve({ method: 'tab' });
    }

    closePdfPrintTab(printWindow);
    URL.revokeObjectURL(url);
    downloadPdfBlob(blob, filename);
    return Promise.resolve({ method: 'download' });
}

/** Print the current page (HTML preview). Reliable on mobile and email-link browsers. */
export function printCurrentDocument() {
    window.print();
}

/**
 * Print a generated PDF.
 * Desktop: hidden iframe, wait for load, then print.
 * Mobile: open the PDF in a new tab (preparePdfPrintTab during the tap so
 * popup blockers do not turn this into a download).
 */
export function printPdfBlob(blob, filename = 'document.pdf', { printWindow } = {}) {
    if (isMobileViewport()) {
        return openPdfInTab(blob, filename, printWindow);
    }

    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.setAttribute('title', 'Print preview');
        iframe.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'width:100%',
            'height:100%',
            'border:0',
            'opacity:0',
            'pointer-events:none',
            'z-index:-1',
        ].join(';');
        iframe.src = url;

        let settled = false;
        const cleanup = () => {
            window.setTimeout(() => {
                iframe.remove();
                URL.revokeObjectURL(url);
            }, 60_000);
        };

        const fail = (message) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error(message));
        };

        const runPrint = () => {
            if (settled) return;
            settled = true;
            try {
                const frameWindow = iframe.contentWindow;
                if (!frameWindow) {
                    throw new Error('Could not open the print preview.');
                }
                frameWindow.focus();
                frameWindow.print();
                resolve({ method: 'print' });
            } catch {
                fail('Failed to print PDF.');
                return;
            }
            cleanup();
        };

        iframe.addEventListener('load', () => {
            window.setTimeout(runPrint, 500);
        }, { once: true });
        iframe.addEventListener('error', () => {
            fail('Failed to load the PDF for printing.');
        }, { once: true });

        document.body.appendChild(iframe);
        window.setTimeout(runPrint, 2500);
    });
}

/** Resolve the PDF, then print. Opens the mobile tab before any await. */
export async function printPdfFromSource(getSource) {
    const printWindow = preparePdfPrintTab();
    try {
        const source = await getSource();
        if (!source?.blob) {
            throw new Error('PDF is not ready yet.');
        }
        return await printPdfBlob(source.blob, source.filename || 'document.pdf', { printWindow });
    } catch (err) {
        closePdfPrintTab(printWindow);
        throw err;
    }
}

export async function shareCachedPdfBlob({ blob, filename, message, docNumber, documentType }) {
    const file = new File([blob], filename, { type: 'application/pdf' });
    const shareData = { text: message, title: docNumber, files: [file] };

    if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        if (documentType) {
            capturePdfDownloaded(documentType, PDF_ACTIONS.SHARE);
        }
        return { method: 'share' };
    }

    downloadPdfBlob(blob, filename, { documentType });
    return { method: 'download' };
}

export async function shareInvoicePdf(invoice, client, businessInfo, options = {}) {
    const mode = options.mode ?? 'auto';
    const message = buildInvoiceShareMessage(invoice, client, businessInfo, mode);
    const docNumber = getDocumentNumber(invoice, mode);
    const resolvedMode = resolvePdfMode(invoice, mode);
    const documentType = documentTypeFromMode(resolvedMode);

    if (options.cached?.blob) {
        return shareCachedPdfBlob({
            blob: options.cached.blob,
            filename: options.cached.filename,
            message,
            docNumber,
            documentType,
        });
    }

    const { generateInvoicePdfBlob } = await import('./pdfGenerator');
    const { blob, filename } = await generateInvoicePdfBlob(invoice, client, businessInfo, { mode });
    return shareCachedPdfBlob({ blob, filename, message, docNumber, documentType });
}

export function getShareFallbackHint() {
    return canSharePdfFiles()
        ? null
        : 'Your browser opened a download instead. Attach the PDF in WhatsApp or your email app.';
}
