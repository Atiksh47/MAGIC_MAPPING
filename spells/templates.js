function generateCircle(n = 64) {
    return Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2;
        return { x: Math.cos(t), y: Math.sin(t) };
    });
}

function generateLine(n = 64) {
    return Array.from({ length: n }, (_, i) => ({
        x: (i / (n - 1)) * 2 - 1,
        y: 0
    }));
}

function generateZigZag(n = 64) {
    const segs = 5;
    return Array.from({ length: n }, (_, i) => {
        const t    = i / (n - 1);
        const seg  = Math.floor(t * segs);
        const segT = t * segs - seg;
        return {
            x: t * 2 - 1,
            y: (seg % 2 === 0 ? segT : 1 - segT) * 2 - 1
        };
    });
}

function generateSpiral(n = 64) {
    return Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 4;
        const r = 0.15 + 0.85 * (i / n);
        return { x: Math.cos(t) * r, y: Math.sin(t) * r };
    });
}

// Equilateral triangle — clockwise from top
function generateTriangle(n = 64) {
    const verts = [0, 1, 2, 0].map(i => {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        return { x: Math.cos(a), y: Math.sin(a) };
    });
    const pts = [];
    const perSide = Math.floor(n / 3);
    for (let s = 0; s < 3; s++) {
        const a = verts[s], b = verts[s + 1];
        for (let i = 0; i < perSide; i++) {
            const t = i / perSide;
            pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        }
    }
    while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
    return pts.slice(0, n);
}

// V-shape — down-left, bottom, up-right
function generateV(n = 64) {
    const half = Math.floor(n / 2);
    const pts  = [];
    for (let i = 0; i < half; i++) {
        const t = i / (half - 1);
        pts.push({ x: -1 + t, y: -1 + t });
    }
    for (let i = 0; i < n - half; i++) {
        const t = i / (n - half - 1);
        pts.push({ x: t, y: 1 - t });
    }
    return pts;
}

// Z-shape — top-right → top-left → bottom-right → bottom-left (3 strokes)
function generateZ(n = 64) {
    const seg = Math.floor(n / 3);
    const pts = [];
    // top bar: right to left
    for (let i = 0; i < seg; i++) {
        const t = i / (seg - 1);
        pts.push({ x: 1 - 2 * t, y: -1 });
    }
    // diagonal: top-left to bottom-right
    for (let i = 0; i < seg; i++) {
        const t = i / (seg - 1);
        pts.push({ x: -1 + 2 * t, y: -1 + 2 * t });
    }
    // bottom bar: left to right
    const rem = n - pts.length;
    for (let i = 0; i < rem; i++) {
        const t = i / (rem - 1);
        pts.push({ x: -1 + 2 * t, y: 1 });
    }
    return pts;
}

// Figure-8 (lemniscate)
function generateFigureEight(n = 64) {
    return Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2;
        const s = Math.sin(t);
        return {
            x: Math.cos(t),
            y: s * Math.cos(t)
        };
    });
}

export const templates = [
    { name: 'circle',     points: generateCircle() },
    { name: 'line',       points: generateLine() },
    { name: 'zigzag',     points: generateZigZag() },
    { name: 'spiral',     points: generateSpiral() },
    { name: 'triangle',   points: generateTriangle() },
    { name: 'v',          points: generateV() },
    { name: 'z',          points: generateZ() },
    { name: 'figureeight',points: generateFigureEight() },
];
