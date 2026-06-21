/**
 * Hermes TextDecoder rejects "ascii" — some deps (e.g. @react-pdf/renderer) request it.
 * Remap legacy encodings to utf-8 for single-byte ASCII-safe data.
 */
if (typeof globalThis.TextDecoder !== 'undefined') {
    const NativeTextDecoder = globalThis.TextDecoder;
    globalThis.TextDecoder = function TextDecoder(encoding = 'utf-8', options) {
        const enc = String(encoding).toLowerCase();
        const legacy = ['ascii', 'latin1', 'iso-8859-1', 'binary', 'us-ascii'];
        const safe = legacy.includes(enc) ? 'utf-8' : encoding;
        return new NativeTextDecoder(safe, options);
    };
    globalThis.TextDecoder.prototype = NativeTextDecoder.prototype;
}
