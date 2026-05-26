import { PAGE_W, PAGE_H } from './pdfLogo';

const patternCache = new Map();
const PX_PER_MM = 3.6;
const TILE_PX = 112;

function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function polygon(ctx, cx, cy, sides, radius, rotation) {
    ctx.beginPath();
    for (let i = 0; i < sides; i += 1) {
        const angle = rotation + (Math.PI * 2 * i) / sides;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
}

/** Interlocking 8-fold rosette tile — seamless when repeated */
function drawGirihTile(ctx, size, r, g, b) {
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = 1.05;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.34)`;

    const h = size / 2;
    const rosetteRadius = h * 0.92;
    const inner = rosetteRadius * 0.36;
    const outer = rosetteRadius * 0.52;

    const rosetteCenters = [
        [h, h],
        [0, 0],
        [size, 0],
        [0, size],
        [size, size],
    ];

    for (const [cx, cy] of rosetteCenters) {
        polygon(ctx, cx, cy, 8, outer, -Math.PI / 8);
        polygon(ctx, cx, cy, 4, inner * Math.SQRT2, Math.PI / 4);
        polygon(ctx, cx, cy, 4, inner * Math.SQRT2, 0);

        for (let i = 0; i < 8; i += 1) {
            const angle = (Math.PI * i) / 4 - Math.PI / 8;
            line(
                ctx,
                cx,
                cy,
                cx + outer * Math.cos(angle),
                cy + outer * Math.sin(angle)
            );
        }
    }

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.22)`;
    const connectors = [
        [0, h, size, h],
        [h, 0, h, size],
        [0, 0, size, size],
        [size, 0, 0, size],
    ];
    for (const [x1, y1, x2, y2] of connectors) {
        line(ctx, x1, y1, x2, y2);
    }
}

function buildFullPagePatternDataUrl(primaryRgb) {
    const [r, g, b] = primaryRgb;
    const key = `${r}-${g}-${b}`;
    if (patternCache.has(key)) {
        return patternCache.get(key);
    }

    const width = Math.ceil(PAGE_W * PX_PER_MM);
    const height = Math.ceil(PAGE_H * PX_PER_MM);

    const tile = document.createElement('canvas');
    tile.width = TILE_PX;
    tile.height = TILE_PX;
    const tileCtx = tile.getContext('2d');
    if (!tileCtx) return '';

    drawGirihTile(tileCtx, TILE_PX, r, g, b);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const pattern = ctx.createPattern(tile, 'repeat');
    if (!pattern) return '';

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/png');
    patternCache.set(key, dataUrl);
    return dataUrl;
}

/** Subtle Islamic geometric tessellation — full page, behind content */
export function drawPdfGeometricBackground(doc, primaryRgb = [2, 132, 199]) {
    const dataUrl = buildFullPagePatternDataUrl(primaryRgb);
    if (!dataUrl) return;

    if (typeof doc.setGState === 'function' && doc.GState) {
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.72 }));
        doc.addImage(dataUrl, 'PNG', 0, 0, PAGE_W, PAGE_H, undefined, 'FAST');
        doc.restoreGraphicsState();
        return;
    }

    doc.addImage(dataUrl, 'PNG', 0, 0, PAGE_W, PAGE_H, undefined, 'FAST');
}
