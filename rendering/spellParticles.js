// Builds target particle positions/colors/sizes for each spell and the ambient state.
// All coordinates are in Three.js world space (camera at z=10, drawing plane at z=0).

const N = 20_000;

function rand() { return Math.random(); }
function randRange(a, b) { return a + rand() * (b - a); }
function lerp(a, b, t) { return a + (b - a) * t; }

// ── Seeded RNG (mulberry32) ────────────────────────────────────────────────────
function mulberry32(seed) {
    let a = seed | 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Ambient: soft drifting star-field ─────────────────────────────────────────
export function buildAmbientTargets(tPos, tCol, tSiz) {
    const rng = mulberry32(42);
    for (let i = 0; i < N; i++) {
        const r   = rng() * 12;
        const th  = rng() * Math.PI * 2;
        const ph  = Math.acos(2 * rng() - 1);
        tPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
        tPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
        tPos[i*3+2] = randRange(-3, 3);

        const bright = 0.2 + rng() * 0.4;
        tCol[i*3]   = bright * 0.4;
        tCol[i*3+1] = bright * 0.5;
        tCol[i*3+2] = bright;

        tSiz[i] = 0.5 + rng() * 1.5;
    }
}

// ── circle — Aegis Rune: cyan Fibonacci sphere shell ──────────────────────────
export function buildCircle(tPos, tCol, tSiz) {
    const PHI = Math.PI * (3 - Math.sqrt(5));
    const rng = mulberry32(1);
    for (let i = 0; i < N; i++) {
        const y  = 1 - (i / (N - 1)) * 2;
        const r  = Math.sqrt(Math.max(0, 1 - y * y));
        const th = PHI * i;
        // Mix: 70% on shell surface, 30% filling inner bands
        const shell = i < N * 0.7 ? 3.2 : 3.2 * (0.6 + rng() * 0.4);
        tPos[i*3]   = r * Math.cos(th) * shell;
        tPos[i*3+1] = y * shell;
        tPos[i*3+2] = r * Math.sin(th) * shell;

        const b = 0.7 + rng() * 0.3;
        tCol[i*3]   = 0.27 * b;
        tCol[i*3+1] = 0.8  * b;
        tCol[i*3+2] = 1.0  * b;

        tSiz[i] = 1.5 + rng() * 2.5;
    }
}

// ── zigzag — Volt Sigil: yellow recursive lightning tree ─────────────────────
export function buildZigzag(tPos, tCol, tSiz) {
    // Pre-generate branch segments via recursive descent
    const segments = [];
    function branch(x, y, z, dx, dy, dz, len, depth) {
        if (depth === 0 || len < 0.05) return;
        segments.push({ x, y, z, ex: x+dx*len, ey: y+dy*len, ez: z+dz*len });
        const spreadAngle = 0.7 - depth * 0.08;
        for (let b = 0; b < 2; b++) {
            const phi   = rand() * Math.PI * 2;
            const theta = rand() * spreadAngle;
            const nx = dx * Math.cos(theta) + Math.cos(phi) * Math.sin(theta);
            const ny = dy * Math.cos(theta) + Math.sin(phi) * Math.sin(theta);
            const nz = dz * Math.cos(theta) + Math.cos(phi + 1.2) * Math.sin(theta);
            const mag = Math.hypot(nx, ny, nz) || 1;
            branch(x+dx*len, y+dy*len, z+dz*len, nx/mag, ny/mag, nz/mag, len*0.65, depth-1);
        }
    }
    branch(0, -4, 0, 0, 1, 0, 3.5, 5);

    const totalLen = segments.reduce((s, seg) =>
        s + Math.hypot(seg.ex-seg.x, seg.ey-seg.y, seg.ez-seg.z), 0);

    let idx = 0;
    for (const seg of segments) {
        const segLen = Math.hypot(seg.ex-seg.x, seg.ey-seg.y, seg.ez-seg.z);
        const count  = Math.round((segLen / totalLen) * N);
        for (let j = 0; j < count && idx < N; j++, idx++) {
            const t = j / Math.max(1, count - 1);
            tPos[idx*3]   = lerp(seg.x, seg.ex, t) + (rand()-0.5)*0.15;
            tPos[idx*3+1] = lerp(seg.y, seg.ey, t) + (rand()-0.5)*0.15;
            tPos[idx*3+2] = lerp(seg.z, seg.ez, t) + (rand()-0.5)*0.15;

            tCol[idx*3]   = 1.0;
            tCol[idx*3+1] = 0.85 + rand()*0.15;
            tCol[idx*3+2] = 0.05 + rand()*0.1;

            tSiz[idx] = 2.5 - (1 - t) * 1.2;
        }
    }
    // Fill any remainder
    while (idx < N) {
        tPos[idx*3] = (rand()-0.5)*6; tPos[idx*3+1] = (rand()-0.5)*8; tPos[idx*3+2] = (rand()-0.5)*2;
        tCol[idx*3] = 1; tCol[idx*3+1] = 0.9; tCol[idx*3+2] = 0;
        tSiz[idx] = 1; idx++;
    }
}

// ── spiral — Vortex Seal: purple contracting 3D helix ────────────────────────
export function buildSpiral(tPos, tCol, tSiz) {
    const rng = mulberry32(3);
    for (let i = 0; i < N; i++) {
        const t      = i / N;
        const turns  = 6;
        const angle  = t * turns * Math.PI * 2;
        const radius = 3.5 * (1 - t * 0.85);
        const jitter = rng() * 0.12;

        tPos[i*3]   = Math.cos(angle) * (radius + jitter);
        tPos[i*3+1] = t * 5 - 2.5 + (rng()-0.5)*0.15;
        tPos[i*3+2] = Math.sin(angle) * (radius + jitter);

        const b = 0.6 + rng() * 0.4;
        tCol[i*3]   = 0.8  * b;
        tCol[i*3+1] = 0.27 * b;
        tCol[i*3+2] = 1.0  * b;

        tSiz[i] = 1.0 + (1 - t) * 3.0;
    }
}

// ── line — Rift Slash: orange two-half fracture plane ─────────────────────────
export function buildLine(tPos, tCol, tSiz) {
    const rng = mulberry32(4);
    for (let i = 0; i < N; i++) {
        const side  = i < N / 2 ? -1 : 1;
        const gap   = 0.08 + rng() * 2.8;
        const y     = (rng() - 0.5) * 6;
        const z     = (rng() - 0.5) * 1.0;
        const edge  = Math.abs(gap) < 0.3;   // particles near the crack edge glow white

        tPos[i*3]   = side * gap;
        tPos[i*3+1] = y;
        tPos[i*3+2] = z;

        if (edge) {
            tCol[i*3] = 1.0; tCol[i*3+1] = 0.9; tCol[i*3+2] = 0.7;
        } else {
            tCol[i*3] = 1.0; tCol[i*3+1] = 0.4 + rng()*0.2; tCol[i*3+2] = 0.1;
        }

        tSiz[i] = edge ? 3.5 : 1.5 + rng() * 2.0;
    }
}

// ── triangle — Primordial Flame: red tetrahedron + rising fire column ─────────
export function buildTriangle(tPos, tCol, tSiz) {
    const rng = mulberry32(5);
    // Tetrahedron vertices (R=2.5)
    const R = 2.5;
    const verts = [
        [ 0,           R,           0           ],
        [ R*2/3*Math.sqrt(2), -R/3, 0           ],
        [-R/3*Math.sqrt(2),   -R/3,  R/Math.sqrt(3)*Math.sqrt(2) ],
        [-R/3*Math.sqrt(2),   -R/3, -R/Math.sqrt(3)*Math.sqrt(2) ],
    ];
    const faces = [[0,1,2],[0,1,3],[0,2,3],[1,2,3]];

    const faceCount = Math.floor(N * 0.5);
    for (let i = 0; i < faceCount; i++) {
        const face = faces[i % 4];
        const [a, b, c] = [verts[face[0]], verts[face[1]], verts[face[2]]];
        let u = rng(), v = rng();
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        const w = 1 - u - v;
        tPos[i*3]   = a[0]*u + b[0]*v + c[0]*w + (rng()-0.5)*0.2;
        tPos[i*3+1] = a[1]*u + b[1]*v + c[1]*w + (rng()-0.5)*0.2;
        tPos[i*3+2] = a[2]*u + b[2]*v + c[2]*w + (rng()-0.5)*0.2;
        tCol[i*3]   = 1.0;
        tCol[i*3+1] = 0.2 + rng()*0.2;
        tCol[i*3+2] = 0.0;
        tSiz[i] = 1.5 + rng()*2;
    }

    // Rising fire column
    for (let i = faceCount; i < N; i++) {
        const r      = rng() * 0.7;
        const angle  = rng() * Math.PI * 2;
        const height = rng() * 4.5 - 0.5;
        tPos[i*3]   = Math.cos(angle) * r;
        tPos[i*3+1] = height;
        tPos[i*3+2] = Math.sin(angle) * r;
        const ht = Math.max(0, height / 4.5);
        tCol[i*3]   = 1.0;
        tCol[i*3+1] = lerp(0.3, 0.95, ht);
        tCol[i*3+2] = lerp(0.0, 0.3,  ht);
        tSiz[i] = 3.5 * (1 - ht * 0.8);
    }
}

// ── v — Runic Wings: green swept wing pair ────────────────────────────────────
export function buildV(tPos, tCol, tSiz) {
    const rng = mulberry32(6);
    const half = Math.floor(N / 2);
    for (let wing = 0; wing < 2; wing++) {
        const sign = wing === 0 ? -1 : 1;
        const base = wing * half;
        for (let i = 0; i < half; i++) {
            const t     = i / half;
            const span  = sign * t * 4.5;
            const chord = (rng() - 0.5) * 1.5 * (1 - t * 0.75);
            const sweep = -t * 1.8;
            const curl  = Math.sin(t * Math.PI) * 0.4 * sign;

            tPos[(base+i)*3]   = span + curl;
            tPos[(base+i)*3+1] = chord;
            tPos[(base+i)*3+2] = sweep;

            const b = 0.5 + rng() * 0.5;
            tCol[(base+i)*3]   = 0.27 * b;
            tCol[(base+i)*3+1] = 1.0  * b;
            tCol[(base+i)*3+2] = 0.67 * b;

            tSiz[base+i] = 0.8 + (1 - t) * 2.5;
        }
    }
}

// ── z — Glyph of Binding: orange lattice cube + orbiting rings ────────────────
export function buildZ(tPos, tCol, tSiz) {
    const rng = mulberry32(7);
    const s   = 2.8;  // half-side
    // 12 edges of a cube
    const corners = [
        [-s,-s,-s],[ s,-s,-s],[ s, s,-s],[-s, s,-s],
        [-s,-s, s],[ s,-s, s],[ s, s, s],[-s, s, s],
    ];
    const edges = [
        [0,1],[1,2],[2,3],[3,0], // bottom face
        [4,5],[5,6],[6,7],[7,4], // top face
        [0,4],[1,5],[2,6],[3,7], // verticals
    ];

    const edgeCount  = Math.floor(N * 0.6);
    const perEdge    = Math.floor(edgeCount / 12);
    let idx = 0;
    for (const [a, b] of edges) {
        for (let j = 0; j < perEdge && idx < edgeCount; j++, idx++) {
            const t = j / perEdge;
            tPos[idx*3]   = lerp(corners[a][0], corners[b][0], t) + (rng()-0.5)*0.15;
            tPos[idx*3+1] = lerp(corners[a][1], corners[b][1], t) + (rng()-0.5)*0.15;
            tPos[idx*3+2] = lerp(corners[a][2], corners[b][2], t) + (rng()-0.5)*0.15;
            tCol[idx*3]   = 1.0;
            tCol[idx*3+1] = 0.67 + rng()*0.2;
            tCol[idx*3+2] = 0.2;
            tSiz[idx] = 2.0 + rng();
        }
    }

    // Orbiting face-center rings
    const faceCenters = [
        [0, 0,-s],[0, 0, s],[-s, 0, 0],[s, 0, 0],[0,-s, 0],[0, s, 0]
    ];
    const normals = [
        [0,0,1],[0,0,1],[1,0,0],[1,0,0],[0,1,0],[0,1,0]
    ];
    const ringCount = N - edgeCount;
    const perFace   = Math.floor(ringCount / 6);
    for (let f = 0; f < 6; f++) {
        const fc = faceCenters[f], nm = normals[f];
        for (let j = 0; j < perFace && idx < N; j++, idx++) {
            const angle = (j / perFace) * Math.PI * 2;
            const rx = nm[0] === 0 ? Math.cos(angle) * s * 0.8 : 0;
            const ry = nm[1] === 0 ? Math.cos(angle) * s * 0.8 : 0;
            const rz = nm[2] === 0 ? Math.sin(angle) * s * 0.8 : 0;
            tPos[idx*3]   = fc[0] + (nm[0]===0 ? rx : 0) + (nm[2]===0 ? 0 : Math.cos(angle)*s*0.8);
            tPos[idx*3+1] = fc[1] + (nm[1]===0 ? ry : 0);
            tPos[idx*3+2] = fc[2] + (nm[2]===0 ? rz : 0) + (nm[0]===0 ? 0 : Math.sin(angle)*s*0.8);
            tCol[idx*3]   = 1.0;
            tCol[idx*3+1] = 0.87;
            tCol[idx*3+2] = 0.5;
            tSiz[idx] = 1.5;
        }
    }
    while (idx < N) {
        tPos[idx*3] = (rng()-0.5)*6; tPos[idx*3+1] = (rng()-0.5)*6; tPos[idx*3+2] = (rng()-0.5)*6;
        tCol[idx*3] = 1; tCol[idx*3+1] = 0.7; tCol[idx*3+2] = 0.2;
        tSiz[idx] = 1; idx++;
    }
}

// ── figureeight — Serpent's Eye: purple lemniscate torus ─────────────────────
export function buildFigureEight(tPos, tCol, tSiz) {
    const rng  = mulberry32(8);
    const TUBE = 0.35;
    const SCALE = 3.0;
    for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const s = rng() * Math.PI * 2;  // angle around tube cross-section

        // Lemniscate of Bernoulli parametric form
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const lx    = (Math.cos(t) / denom) * SCALE;
        const ly    = (Math.sin(t) * Math.cos(t) / denom) * SCALE;

        // Tube tangent (numerical derivative)
        const dt   = 0.001;
        const t2   = t + dt;
        const d2   = 1 + Math.sin(t2)*Math.sin(t2);
        const tlx  = (Math.cos(t2)/d2 - lx/SCALE) / dt;
        const tly  = (Math.sin(t2)*Math.cos(t2)/d2 - ly/SCALE) / dt;
        const tmag = Math.hypot(tlx, tly) || 1;

        // Normal in XY plane (perpendicular to tangent, rotated into 3D)
        const nx =  tly / tmag;
        const ny = -tlx / tmag;

        tPos[i*3]   = lx + Math.cos(s) * TUBE * nx;
        tPos[i*3+1] = ly + Math.cos(s) * TUBE * ny;
        tPos[i*3+2] = Math.sin(s) * TUBE;

        const b = 0.6 + rng() * 0.4;
        tCol[i*3]   = 0.67 * b;
        tCol[i*3+1] = 0.53 * b;
        tCol[i*3+2] = 1.0  * b;

        tSiz[i] = 1.2 + rng() * 1.8;
    }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export function buildTargets(spellName, tPos, tCol, tSiz) {
    switch (spellName) {
        case 'circle':      buildCircle(tPos, tCol, tSiz);      break;
        case 'zigzag':      buildZigzag(tPos, tCol, tSiz);      break;
        case 'spiral':      buildSpiral(tPos, tCol, tSiz);      break;
        case 'line':        buildLine(tPos, tCol, tSiz);         break;
        case 'triangle':    buildTriangle(tPos, tCol, tSiz);    break;
        case 'v':           buildV(tPos, tCol, tSiz);            break;
        case 'z':           buildZ(tPos, tCol, tSiz);            break;
        case 'figureeight': buildFigureEight(tPos, tCol, tSiz); break;
        default:            buildAmbientTargets(tPos, tCol, tSiz);
    }
}
