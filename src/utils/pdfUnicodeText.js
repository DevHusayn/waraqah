import { setPdfFont } from './pdfFonts';

const EMOJI_REGEX = /\p{Extended_Pictographic}(\uFE0F|\uFE0E)?/gu;

export function containsEmoji(text) {
    EMOJI_REGEX.lastIndex = 0;
    return EMOJI_REGEX.test(String(text || ''));
}

const emojiImageCache = new Map();

export function getEmojiDataUrl(emoji) {
    if (emojiImageCache.has(emoji)) {
        return emojiImageCache.get(emoji);
    }
    if (typeof document === 'undefined') {
        return null;
    }

    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(size * 0.85)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText(emoji, size / 2, size / 2 + 1);
    const url = canvas.toDataURL('image/png');
    emojiImageCache.set(emoji, url);
    return url;
}

export function tokenizeTextAndEmoji(text) {
    const value = String(text || '');
    const tokens = [];
    let lastIndex = 0;
    const re = new RegExp(EMOJI_REGEX.source, 'gu');
    let match;

    while ((match = re.exec(value)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ type: 'text', value: value.slice(lastIndex, match.index) });
        }
        tokens.push({ type: 'emoji', value: match[0] });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < value.length) {
        tokens.push({ type: 'text', value: value.slice(lastIndex) });
    }

    return tokens;
}

function wrapTokens(doc, tokens, maxWidth, emojiSizeMm) {
    const lines = [];
    let currentLine = [];
    let currentWidth = 0;

    for (const token of tokens) {
        if (token.type === 'text') {
            const parts = token.value.split(/(\s+)/);
            for (const part of parts) {
                if (!part) continue;
                const partWidth = doc.getTextWidth(part);
                if (currentWidth + partWidth > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = [];
                    currentWidth = 0;
                }
                currentLine.push({ type: 'text', value: part });
                currentWidth += partWidth;
            }
            continue;
        }

        if (currentWidth + emojiSizeMm > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [];
            currentWidth = 0;
        }
        currentLine.push(token);
        currentWidth += emojiSizeMm;
    }

    if (currentLine.length) {
        lines.push(currentLine);
    }

    return lines;
}

export function drawUnicodeText(doc, text, x, y, options = {}) {
    const {
        maxWidth,
        lineHeight = 4,
        fontSize = doc.getFontSize(),
        fontStyle = 'normal',
        textColor,
    } = options;

    const value = String(text || '');
    const emojiSizeMm = fontSize * 0.42;

    setPdfFont(doc, fontStyle);
    doc.setFontSize(fontSize);
    if (textColor) {
        doc.setTextColor(...textColor);
    }

    if (!containsEmoji(value)) {
        const lines = doc.splitTextToSize(value, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * lineHeight;
    }

    const lines = wrapTokens(doc, tokenizeTextAndEmoji(value), maxWidth, emojiSizeMm);
    let cursorY = y;

    for (const line of lines) {
        let cursorX = x;
        for (const token of line) {
            if (token.type === 'text') {
                doc.text(token.value, cursorX, cursorY);
                cursorX += doc.getTextWidth(token.value);
                continue;
            }

            const dataUrl = getEmojiDataUrl(token.value);
            if (dataUrl) {
                doc.addImage(dataUrl, 'PNG', cursorX, cursorY - fontSize * 0.28, emojiSizeMm, emojiSizeMm);
                cursorX += emojiSizeMm;
            }
        }
        cursorY += lineHeight;
    }

    return cursorY;
}
