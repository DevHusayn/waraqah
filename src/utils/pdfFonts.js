export const PDF_FONT_FAMILY = 'WaraqahSans';

const FONT_VFS_NAME = 'WaraqahSans-Regular.ttf';
const FONT_URL = '/fonts/WaraqahSans-Regular.ttf';

let fontsReady = null;

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

async function loadFontBase64() {
    const response = await fetch(FONT_URL);
    if (!response.ok) {
        throw new Error(`Failed to load PDF font (${response.status})`);
    }
    const buffer = await response.arrayBuffer();
    return arrayBufferToBase64(buffer);
}

function registerFonts(doc, fontBase64) {
    doc.addFileToVFS(FONT_VFS_NAME, fontBase64);
    doc.addFont(FONT_VFS_NAME, PDF_FONT_FAMILY, 'normal');
    doc.addFont(FONT_VFS_NAME, PDF_FONT_FAMILY, 'bold');
}

export async function ensurePdfFonts(doc) {
    if (!fontsReady) {
        fontsReady = loadFontBase64().then((fontBase64) => {
            registerFonts(doc, fontBase64);
        });
    }
    await fontsReady;
}

export function setPdfFont(doc, style = 'normal') {
    doc.setFont(PDF_FONT_FAMILY, style === 'bold' ? 'bold' : 'normal');
}
