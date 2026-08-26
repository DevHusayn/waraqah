const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');
const exclude = [
    'InvoiceDocumentPreview.jsx',
    'LandingInvoicePreview.jsx',
    'LandingDashboardPreview.jsx',
    'DocumentPreviewOverlay.jsx',
];

const replacements = [
    [/\bbg-white\b/g, 'bg-surface'],
    [/\btext-zinc-950\b/g, 'text-foreground'],
    [/\btext-zinc-900\b/g, 'text-foreground'],
    [/\btext-zinc-800\b/g, 'text-foreground'],
    [/\btext-zinc-700\b/g, 'text-foreground-muted'],
    [/\btext-zinc-600\b/g, 'text-foreground-muted'],
    [/\btext-zinc-500\b/g, 'text-foreground-muted'],
    [/\btext-zinc-400\b/g, 'text-foreground-muted/70'],
    [/\bborder-zinc-200\/50\b/g, 'border-border/50'],
    [/\bborder-zinc-200\/60\b/g, 'border-border/60'],
    [/\bborder-zinc-200\/70\b/g, 'border-border/70'],
    [/\bborder-zinc-200\/80\b/g, 'border-border/80'],
    [/\bborder-zinc-200\b/g, 'border-border'],
    [/\bborder-zinc-100\/80\b/g, 'border-border/50'],
    [/\bborder-zinc-100\b/g, 'border-border/50'],
    [/\bbg-zinc-50\/80\b/g, 'bg-surface-muted/80'],
    [/\bbg-zinc-50\/60\b/g, 'bg-surface-muted/60'],
    [/\bbg-zinc-50\/40\b/g, 'bg-surface-muted/40'],
    [/\bbg-zinc-50\b/g, 'bg-surface-muted'],
    [/\bhover:bg-zinc-50\/80\b/g, 'hover:bg-surface-muted/80'],
    [/\bhover:bg-zinc-50\b/g, 'hover:bg-surface-muted'],
    [/\bhover:bg-zinc-100\/80\b/g, 'hover:bg-surface-muted'],
    [/\bhover:bg-zinc-100\b/g, 'hover:bg-surface-muted'],
    [/\bdivide-zinc-200\/80\b/g, 'divide-border/80'],
    [/\bdivide-zinc-200\b/g, 'divide-border'],
];

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (/\.(jsx|js)$/.test(entry.name)) files.push(full);
    }
    return files;
}

let changed = 0;
for (const file of walk(root)) {
    if (exclude.some((name) => file.endsWith(name))) continue;
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    for (const [pattern, replacement] of replacements) {
        content = content.replace(pattern, replacement);
    }
    if (content !== original) {
        fs.writeFileSync(file, content);
        changed++;
    }
}

console.log(`Updated ${changed} files`);
