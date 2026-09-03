/**
 * Helvetica (jsPDF built-in) is WinAnsi. Zero-width / unmapped glyphs
 * collapse letter-spacing so wrapped invoice text looks stacked.
 */
const ZERO_WIDTH = /[\u00ad\u200b\u200c\u200d\u2060\ufeff]/g;
const EXTRA_SPACES = /[\u00a0\u202f\u2000-\u200a\u3000]/g;
const SMART_SINGLE = /[\u2018\u2019\u201a\u201b\u2032]/g;
const SMART_DOUBLE = /[\u201c\u201d\u201e\u201f\u2033]/g;
const DASHES = /[\u2010-\u2015\u2212]/g;
const LIST_MARKERS = /[•●▪▫‣·∙○■□]/g;

const TITLE_WORD = /^[A-Z][A-Za-z0-9/&'()+-]*$/;
const CONNECTOR_WORD = /^(of|and|the|or|for|to|a|an|in|on)$/;

function labelWordsBeforeColon(words) {
    const taken = [];
    for (let i = words.length - 1; i >= 0 && taken.length < 5; i -= 1) {
        const word = words[i];
        if (!word) break;
        const isTitle = TITLE_WORD.test(word);
        const isConnector = CONNECTOR_WORD.test(word);
        if (taken.length === 0) {
            if (!isTitle) break;
            taken.unshift(word);
            continue;
        }
        if (isConnector) {
            taken.unshift(word);
            continue;
        }
        if (isTitle) {
            taken.unshift(word);
            const titleCount = taken.filter((part) => TITLE_WORD.test(part)).length;
            if (titleCount >= 2) break;
            continue;
        }
        break;
    }
    return taken;
}

function splitLineOnLabels(line) {
    const remaining = String(line || '').trim();
    if (!remaining) return [];

    const starts = [0];
    const colonRe = /:/g;
    let match = colonRe.exec(remaining);
    while (match) {
        const words = remaining.slice(0, match.index).split(/[ \t]+/).filter(Boolean);
        const label = labelWordsBeforeColon(words);
        if (label.length) {
            const labelText = label.join(' ');
            const pos = remaining.lastIndexOf(labelText, match.index);
            if (pos > 0) starts.push(pos);
        }
        match = colonRe.exec(remaining);
    }
    starts.push(remaining.length);

    const unique = [...new Set(starts)].sort((a, b) => a - b);
    const parts = [];
    for (let i = 0; i < unique.length - 1; i += 1) {
        const slice = remaining.slice(unique[i], unique[i + 1]).trim();
        if (slice) parts.push(slice);
    }
    return parts.length ? parts : [remaining];
}

/** Put each "Label: value" on its own line when pasted as one paragraph. */
export function breakLabeledFields(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .split('\n')
        .flatMap(splitLineOnLabels)
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** Turn mid-line bullets / "' Next Item" separators into real list lines. */
export function breakInlineListMarkers(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\s*[•●▪▫‣·∙○]\s*/g, '\n- ')
        .replace(/\s+'\s+(?=[A-Z])/g, '\n- ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function toPdfSafeText(text) {
    return String(text ?? '')
        .replace(ZERO_WIDTH, '')
        .replace(EXTRA_SPACES, ' ')
        .replace(SMART_SINGLE, "'")
        .replace(SMART_DOUBLE, '"')
        .replace(DASHES, '-')
        .replace(LIST_MARKERS, '-')
        .replace(/[^\n\r\t\x20-\x7e\xa0-\xff]/g, ' ')
        .replace(/[ \t]{2,}/g, ' ');
}

export function formatDocumentAdditionalInfo(text) {
    return breakLabeledFields(String(text || '').trim());
}

export function formatDocumentItemDescription(text) {
    return breakInlineListMarkers(String(text || '').trim());
}

export function preparePdfAdditionalInfo(text) {
    return toPdfSafeText(formatDocumentAdditionalInfo(text)).trim();
}

export function preparePdfItemDescription(text) {
    return toPdfSafeText(formatDocumentItemDescription(text)).trim();
}
