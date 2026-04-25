import { normalizePath, pathDistance } from '../utils/math.js';
import { templates } from './templates.js';

const THRESHOLD    = 0.65;
// Number of rotational offsets to try against each template
const ROTATION_TRIES = 16;

// Try matching path against template at multiple starting offsets
// (handles drawing the same shape from a different start point)
function bestRotationalDistance(path, templatePoints) {
    const n = path.length;
    let best = Infinity;
    for (let r = 0; r < ROTATION_TRIES; r++) {
        const offset = Math.floor((r / ROTATION_TRIES) * n);
        const rotated = [];
        for (let i = 0; i < n; i++) rotated.push(path[(i + offset) % n]);
        const d = pathDistance(rotated, templatePoints);
        if (d < best) best = d;
    }
    return best;
}

export function recognizeSpell(rawPath) {
    const path = normalizePath(rawPath);
    if (!path) return 'neutral';

    let best  = Infinity;
    let match = 'neutral';
    const scores = [];

    for (const t of templates) {
        const d = bestRotationalDistance(path, t.points);
        scores.push({ name: t.name, d: d.toFixed(3) });
        if (d < best) {
            best  = d;
            match = t.name;
        }
    }

    console.log('[spell] best:', match, best.toFixed(3), '| all:', scores.map(s => `${s.name}:${s.d}`).join(' '));
    return best < THRESHOLD ? match : 'neutral';
}
