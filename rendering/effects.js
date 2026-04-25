// ── palette ───────────────────────────────────────────────────────────────────
const C = {
    circle:      { primary: '#44ccff', glow: '#00eeff',  h: 195 },
    zigzag:      { primary: '#ffee22', glow: '#ffaa00',  h:  50 },
    spiral:      { primary: '#cc44ff', glow: '#dd00ff',  h: 280 },
    line:        { primary: '#ff6633', glow: '#ff2200',  h:  15 },
    triangle:    { primary: '#ff4444', glow: '#ff0000',  h:   0 },
    v:           { primary: '#44ffaa', glow: '#00ffcc',  h: 160 },
    z:           { primary: '#ffaa33', glow: '#ff6600',  h:  30 },
    figureeight: { primary: '#aa88ff', glow: '#7733ff',  h: 265 },
    neutral:     { primary: '#aaaaff', glow: '#8888ff',  h: 240 },
};

// ── seeded RNG ────────────────────────────────────────────────────────────────
function mulberry32(a) {
    return () => {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ── fade alpha helper ─────────────────────────────────────────────────────────
function fadeAlpha(state, now, fadeDuration = 1100) {
    if (state.phase === 'fading')
        return Math.max(0, 1 - (now - state.phaseStart) / fadeDuration);
    return 1;
}

// ── flash burst on conversion ─────────────────────────────────────────────────
function drawFlashBurst(ctx, cx, cy, progress, color) {
    // Peaks at progress=0.5, gone by 1
    const a = Math.sin(progress * Math.PI);
    const r = 20 + progress * 160;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0,   `rgba(255,255,255,${a * 0.9})`);
    grad.addColorStop(0.3, color.replace(')', `,${a * 0.6})`).replace('rgb', 'rgba'));
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ── energy ribbon (drawn path glow while drawing) ─────────────────────────────
export function drawEnergyRibbon(ctx, state, canvas) {
    const W    = canvas.width, H = canvas.height;
    const path = state.rawPath;
    if (path.length < 2) return;

    const col   = C[state.spell] ?? C.neutral;
    const flash = state.phase === 'flash' ? state.flashProgress : 0;
    // During drawing phase just show a gentle trace; flash makes it flare
    const base  = 1.5 + flash * 12;
    const glow  = 8   + flash * 40;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    const draw = () => {
        ctx.beginPath();
        ctx.moveTo(path[0].x * W, path[0].y * H);
        for (let i = 1; i < path.length; i++) {
            const mx = ((path[i-1].x + path[i].x) / 2) * W;
            const my = ((path[i-1].y + path[i].y) / 2) * H;
            ctx.quadraticCurveTo(path[i-1].x * W, path[i-1].y * H, mx, my);
        }
    };

    // Outer halo
    draw();
    ctx.globalAlpha = 0.04 + flash * 0.18;
    ctx.lineWidth   = base * 5;
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = col.glow;
    ctx.stroke();

    // Mid glow
    draw();
    ctx.globalAlpha = 0.12 + flash * 0.5;
    ctx.lineWidth   = base * 2.2;
    ctx.shadowBlur  = glow;
    ctx.shadowColor = col.glow;
    ctx.strokeStyle = col.primary;
    ctx.stroke();

    // Bright core
    draw();
    ctx.globalAlpha = 0.55 + flash * 0.45;
    ctx.lineWidth   = base;
    ctx.shadowBlur  = glow * 0.6;
    ctx.shadowColor = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Travelling beads
    const t     = (performance.now() / 380) % 1;
    const beadN = 5 + Math.floor(flash * 8);
    for (let b = 0; b < beadN; b++) {
        const frac = (t + b / beadN) % 1;
        const idx  = Math.min(Math.floor(frac * path.length), path.length - 1);
        const pt   = path[idx];
        ctx.globalAlpha = 0.7 + flash * 0.3;
        ctx.shadowBlur  = 14 + flash * 20;
        ctx.shadowColor = col.glow;
        ctx.fillStyle   = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x * W, pt.y * H, 1.5 + flash * 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ── main spell dispatcher ─────────────────────────────────────────────────────
export function drawSpellEffect(ctx, state, canvas, now) {
    const W  = canvas.width, H = canvas.height;
    const cx = state.center.x * W, cy = state.center.y * H;
    const col = C[state.spell] ?? C.neutral;
    const alpha = fadeAlpha(state, now);

    // Flash burst on conversion
    if (state.phase === 'flash') {
        drawFlashBurst(ctx, cx, cy, state.flashProgress, col.glow);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'screen';

    switch (state.spell) {
        case 'circle':      drawAegisRune(ctx, cx, cy, now);              break;
        case 'zigzag':      drawVoltSigil(ctx, state, canvas, now);       break;
        case 'spiral':      drawVortexSeal(ctx, cx, cy, now);             break;
        case 'line':        drawRiftSlash(ctx, state, canvas, now, alpha); break;
        case 'triangle':    drawPrimordialFlame(ctx, cx, cy, now);        break;
        case 'v':           drawRunicWings(ctx, state, canvas, now);      break;
        case 'z':           drawGlyphOfBinding(ctx, cx, cy, now);         break;
        case 'figureeight': drawSerpentsEye(ctx, cx, cy, now);            break;
    }

    drawRuneGlyph(ctx, state.spell, cx, cy, now, alpha);
    ctx.restore();
}

// ── AEGIS RUNE (circle) ───────────────────────────────────────────────────────
// Ancient protective ward: rotating layered rings with runic tick marks
function drawAegisRune(ctx, cx, cy, now) {
    const t = now / 1000;
    const R = 90 + Math.sin(t * 1.8) * 8;

    // Three concentric rings, counter-rotating
    for (let ring = 0; ring < 4; ring++) {
        const r     = R * (0.3 + ring * 0.23);
        const speed = (ring % 2 === 0 ? 1 : -1) * 0.4;
        const a     = 0.5 - ring * 0.1;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * speed);
        // Dashed ring effect via arc segments
        const segs = 12 + ring * 4;
        for (let s = 0; s < segs; s++) {
            const a0 = (s / segs) * Math.PI * 2;
            const a1 = a0 + (Math.PI * 2 / segs) * 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, r, a0, a1);
            ctx.strokeStyle = `rgba(68,204,255,${a})`;
            ctx.lineWidth   = 1.5;
            ctx.shadowBlur  = 14;
            ctx.shadowColor = '#00eeff';
            ctx.stroke();
        }
        ctx.restore();
    }

    // Rotating runic tick marks at outer ring
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + t * 0.5;
        const inner = R * 0.88, outer = R * 1.08;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
        ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
        ctx.strokeStyle = i % 4 === 0 ? '#ffffff' : '#44ccff';
        ctx.lineWidth   = i % 4 === 0 ? 2 : 1;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#00eeff';
        ctx.stroke();
    }

    // Pulsing core sigil
    drawHexRune(ctx, cx, cy, R * 0.32, t);

    // Orbiting rune fragments
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t * 0.9;
        const r     = R * 0.62;
        const px    = cx + Math.cos(angle) * r;
        const py    = cy + Math.sin(angle) * r;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + t);
        ctx.strokeStyle = 'rgba(68,204,255,0.8)';
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#00eeff';
        ctx.beginPath();
        ctx.moveTo(-5, -5); ctx.lineTo(5, 0); ctx.lineTo(-5, 5); ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

function drawHexRune(ctx, cx, cy, r, t) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.3);
    ctx.strokeStyle = 'rgba(100,220,255,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 12;
    ctx.shadowColor = '#00ccff';
    for (let pass = 0; pass < 2; pass++) {
        ctx.rotate(pass * (Math.PI / 6));
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a  = (i / 6) * Math.PI * 2;
            const rr = r * (pass === 0 ? 1 : 0.55);
            i === 0 ? ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
                    : ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
}

// ── VOLT SIGIL (zigzag) ───────────────────────────────────────────────────────
// Primordial storm rune: crackling bolt web fans out from the drawn path
function drawVoltSigil(ctx, state, canvas, now) {
    const W = canvas.width, H = canvas.height;
    const path = state.rawPath;
    if (path.length < 2) return;

    const seed = Math.floor(now / 35);

    const drawBolt = (jitter, lw, color, alpha) => {
        const rng = mulberry32(seed + jitter * 31337);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth   = lw;
        ctx.shadowBlur  = lw * 12;
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        path.forEach((p, i) => {
            const x = p.x * W + (rng() - 0.5) * jitter;
            const y = p.y * H + (rng() - 0.5) * jitter;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
    };

    drawBolt(26, 3.5, '#ffffff',  0.9);
    drawBolt(20, 7,   '#ffee44',  0.6);
    drawBolt(32, 1.5, '#ffdd88',  0.45);
    drawBolt(42, 1,   '#ffcc44',  0.3);

    // Branch bolts shooting outward from path midpoint
    const mid  = path[Math.floor(path.length / 2)];
    const rng2 = mulberry32(seed * 7 + 99);
    for (let b = 0; b < 5; b++) {
        const angle = rng2() * Math.PI * 2;
        const len   = 60 + rng2() * 80;
        ctx.globalAlpha = 0.5 * rng2();
        ctx.strokeStyle = '#ffee22';
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        let x = mid.x * W, y = mid.y * H;
        ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
            x += Math.cos(angle + (rng2() - 0.5) * 1.2) * (len / 4);
            y += Math.sin(angle + (rng2() - 0.5) * 1.2) * (len / 4);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

// ── VORTEX SEAL (spiral) ──────────────────────────────────────────────────────
// Primordial void: contracting gravity spiral with luminous debris field
function drawVortexSeal(ctx, cx, cy, now) {
    const t = now / 1000;

    // Inward contracting rings
    for (let i = 0; i < 8; i++) {
        const phase = ((t * 0.6 + i * 0.14) % 1);
        const r     = (1 - phase) * 140;
        const alpha = phase * 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180,60,255,${alpha})`;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 14 * phase;
        ctx.shadowColor = '#cc00ff';
        ctx.stroke();
    }

    // Three counter-winding spiral arms
    for (let arm = 0; arm < 3; arm++) {
        const offset = (arm / 3) * Math.PI * 2;
        ctx.beginPath();
        for (let j = 0; j <= 100; j++) {
            const frac  = j / 100;
            const angle = frac * Math.PI * 5 + offset - t * 1.1;
            const r     = frac * 130;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(200,80,255,${0.3 + arm * 0.1})`;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#cc00ff';
        ctx.stroke();
    }

    // Orbiting debris particles
    for (let i = 0; i < 18; i++) {
        const orbit = 0.4 + (i / 18) * 0.6;
        const angle = (i / 18) * Math.PI * 2 - t * (1.5 + orbit);
        const r     = orbit * 120;
        const px    = cx + Math.cos(angle) * r;
        const py    = cy + Math.sin(angle) * r;
        const size  = 1 + (1 - orbit) * 3;
        ctx.globalAlpha = orbit * 0.8;
        ctx.fillStyle   = `hsl(${280 + i * 5},90%,70%)`;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#cc00ff';
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Void core
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 36);
    core.addColorStop(0,   'rgba(0,0,0,0.95)');
    core.addColorStop(0.5, 'rgba(40,0,80,0.6)');
    core.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = 'screen';

    // Inner eye glow
    ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.2;
    ctx.shadowBlur  = 20;
    ctx.shadowColor = '#dd00ff';
    ctx.fillStyle   = '#cc44ff';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
}

// ── RIFT SLASH (line) ─────────────────────────────────────────────────────────
// Dimensional tear: a glowing crack through reality with light bleeding out
function drawRiftSlash(ctx, state, canvas, now, alpha) {
    const W    = canvas.width, H = canvas.height;
    const path = state.rawPath;
    if (path.length < 2) return;

    const age = state.phase === 'fading'
        ? Math.min(1, (now - state.phaseStart) / 1100)
        : 0;

    const drawPath = () => {
        ctx.beginPath();
        ctx.moveTo(path[0].x * W, path[0].y * H);
        for (let i = 1; i < path.length; i++)
            ctx.lineTo(path[i].x * W, path[i].y * H);
    };

    // Outer dimensional bleed — wide soft orange
    drawPath();
    ctx.globalAlpha = (1 - age) * 0.35;
    ctx.strokeStyle = '#ff3300';
    ctx.lineWidth   = 28;
    ctx.shadowBlur  = 50;
    ctx.shadowColor = '#ff2200';
    ctx.stroke();

    // Mid rift glow
    drawPath();
    ctx.globalAlpha = (1 - age) * 0.65;
    ctx.strokeStyle = '#ff6633';
    ctx.lineWidth   = 10;
    ctx.shadowBlur  = 20;
    ctx.stroke();

    // White-hot core
    drawPath();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 30;
    ctx.shadowColor = '#ff4400';
    ctx.stroke();

    // Void gap (darken center of rift)
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    drawPath();
    ctx.globalAlpha = (1 - age) * 0.7;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth   = 3;
    ctx.shadowBlur  = 0;
    ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = 'screen';

    // Light leak sparks perpendicular to the slash
    const dx    = path[path.length - 1].x - path[0].x;
    const dy    = path[path.length - 1].y - path[0].y;
    const len   = Math.hypot(dx, dy) + 1e-9;
    const perpX = -dy / len, perpY = dx / len;
    ctx.globalAlpha = (1 - age) * 0.9;
    ctx.fillStyle   = '#ff8844';
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#ff4400';
    for (let i = 0; i < 9; i++) {
        const frac = i / 8;
        const idx  = Math.min(Math.floor(frac * path.length), path.length - 1);
        const side = i % 2 === 0 ? 1 : -1;
        const px   = path[idx].x * W + perpX * 22 * age * side;
        const py   = path[idx].y * H + perpY * 22 * age * side;
        ctx.beginPath();
        ctx.arc(px, py, 2 * (1 - age), 0, Math.PI * 2);
        ctx.fill();
    }
}

// ── PRIMORDIAL FLAME (triangle) ───────────────────────────────────────────────
// Ancient fire rune: pillar of living flame erupting from the triangle center
function drawPrimordialFlame(ctx, cx, cy, now) {
    const t = now / 1000;

    // Rising flame columns
    for (let col = 0; col < 5; col++) {
        const offset  = (col - 2) * 22;
        const phase   = (t * 1.3 + col * 0.3) % 1;
        const height  = 80 + col * 10;
        const flicker = Math.sin(t * 8 + col * 1.4) * 6;

        const grad = ctx.createLinearGradient(cx + offset, cy, cx + offset + flicker, cy - height);
        grad.addColorStop(0,   'rgba(255,80,0,0.9)');
        grad.addColorStop(0.4, 'rgba(255,160,0,0.7)');
        grad.addColorStop(0.75,'rgba(255,220,80,0.4)');
        grad.addColorStop(1,   'rgba(255,255,200,0)');

        ctx.globalAlpha = 0.7 - Math.abs(col - 2) * 0.1;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = '#ff4400';
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.ellipse(cx + offset + flicker * 0.5, cy - height * 0.5, 8 + col * 2, height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Rotating fire triangle outline
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.2);
    ctx.strokeStyle = 'rgba(255,100,0,0.8)';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 20;
    ctx.shadowColor = '#ff4400';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const r = 55 + Math.sin(t * 4 + i) * 5;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner flame rune
    ctx.strokeStyle = 'rgba(255,200,50,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = '#ffaa00';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const r = 28;
        i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Ember sparks rising
    const seed = Math.floor(t * 12);
    const rng  = mulberry32(seed);
    for (let i = 0; i < 12; i++) {
        const ex = cx + (rng() - 0.5) * 80;
        const ey = cy - rng() * 110;
        const er = 1 + rng() * 2.5;
        ctx.globalAlpha = rng() * 0.8;
        ctx.fillStyle   = `hsl(${20 + rng() * 40},100%,${60 + rng() * 30}%)`;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = '#ff4400';
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ── RUNIC WINGS (V-shape) ─────────────────────────────────────────────────────
// Archaic wind/spirit wings: two sweeping arcs of feather-light energy
function drawRunicWings(ctx, state, canvas, now) {
    const W    = canvas.width, H = canvas.height;
    const path = state.rawPath;
    if (path.length < 3) return;

    const t  = now / 1000;
    const cx = state.center.x * W;
    const cy = state.center.y * H;

    // Find the V tip (lowest Y = vertex)
    let tipIdx = 0;
    for (let i = 1; i < path.length; i++)
        if (path[i].y > path[tipIdx].y) tipIdx = i;

    const tip = { x: path[tipIdx].x * W, y: path[tipIdx].y * H };

    // Draw each wing as a sweeping arc of layered strokes
    for (let wing = 0; wing < 2; wing++) {
        const half = wing === 0 ? path.slice(0, tipIdx + 1) : path.slice(tipIdx);
        if (half.length < 2) continue;

        for (let layer = 0; layer < 4; layer++) {
            const spread = layer * 6;
            const alpha  = 0.6 - layer * 0.12;
            const lw     = 4 - layer * 0.8;
            const hue    = 160 + layer * 8;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = `hsl(${hue},90%,70%)`;
            ctx.lineWidth   = lw;
            ctx.shadowBlur  = 18 - layer * 3;
            ctx.shadowColor = '#00ffcc';
            ctx.beginPath();
            half.forEach((p, i) => {
                const px = p.x * W + (wing === 0 ? -spread : spread) * Math.sin(t * 2 + i * 0.1);
                const py = p.y * H - spread * 0.5;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            });
            ctx.stroke();
        }
    }

    // Feather glyphs along each wing
    const rng = mulberry32(Math.floor(t * 6));
    for (let i = 0; i < path.length; i += 4) {
        const p     = path[i];
        const angle = Math.atan2(
            (path[Math.min(i+1,path.length-1)].y - p.y),
            (path[Math.min(i+1,path.length-1)].x - p.x)
        );
        ctx.save();
        ctx.translate(p.x * W, p.y * H);
        ctx.rotate(angle + Math.PI / 2);
        ctx.strokeStyle = 'rgba(100,255,200,0.5)';
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#00ffcc';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-6, -10); ctx.lineTo(0, -7); ctx.lineTo(6, -10); ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.restore();
    }

    // Central rune at tip
    ctx.save();
    ctx.translate(tip.x, tip.y);
    ctx.rotate(t * 0.5);
    ctx.strokeStyle = 'rgba(68,255,170,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
    ctx.restore();
}

// ── GLYPH OF BINDING (Z-shape) ────────────────────────────────────────────────
// Ancient binding curse: chains of light spiral outward, locking sigils orbit
function drawGlyphOfBinding(ctx, cx, cy, now) {
    const t = now / 1000;

    // Chain link rings expanding outward
    for (let ring = 0; ring < 6; ring++) {
        const r     = 18 + ring * 20 + Math.sin(t * 2 + ring) * 4;
        const alpha = 0.7 - ring * 0.1;
        const rot   = t * (ring % 2 === 0 ? 0.4 : -0.4) + ring * 0.4;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(255,160,40,${alpha})`;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 12;
        ctx.shadowColor = '#ff6600';

        // Octagonal chain link
        ctx.beginPath();
        for (let s = 0; s < 8; s++) {
            const a = (s / 8) * Math.PI * 2;
            s === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
                    : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    // Binding rune lines radiating from center
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + t * 0.15;
        const inner = 10, outer = 100 + Math.sin(t * 3 + i) * 10;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#ffaa33';
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
        ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
        ctx.stroke();
    }

    // Orbiting lock sigils
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + t * 0.7;
        const r     = 65;
        const px    = cx + Math.cos(angle) * r;
        const py    = cy + Math.sin(angle) * r;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-angle + t);
        ctx.strokeStyle = 'rgba(255,170,50,0.85)';
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#ff6600';
        // Bracket sigil
        ctx.beginPath();
        ctx.rect(-6, -8, 12, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, -8, 4, Math.PI, 0);
        ctx.stroke();
        ctx.restore();
    }

    // Central Z brand
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.25);
    ctx.strokeStyle = 'rgba(255,200,80,0.9)';
    ctx.lineWidth   = 2.5;
    ctx.shadowBlur  = 18;
    ctx.shadowColor = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(12, -14); ctx.lineTo(-12, -14);
    ctx.lineTo(12, 14);  ctx.lineTo(-12, 14);
    ctx.stroke();
    ctx.restore();
}

// ── SERPENT'S EYE (figure-eight) ─────────────────────────────────────────────
// Twin void eyes: two interlocked vortex lobes with serpentine light tendrils
function drawSerpentsEye(ctx, cx, cy, now) {
    const t  = now / 1000;
    const r  = 55; // lobe radius

    // Two lobe centers
    const lobes = [
        { x: cx - r * 0.7, y: cy, hue: 265 },
        { x: cx + r * 0.7, y: cy, hue: 290 },
    ];

    for (const lobe of lobes) {
        // Contracting rings per lobe
        for (let i = 0; i < 5; i++) {
            const phase = ((t * 0.7 + i * 0.22) % 1);
            const lr    = (1 - phase) * r;
            const a     = phase * 0.6;
            ctx.beginPath();
            ctx.arc(lobe.x, lobe.y, lr, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${lobe.hue},90%,65%,${a})`;
            ctx.lineWidth   = 1.5;
            ctx.shadowBlur  = 12 * phase;
            ctx.shadowColor = `hsl(${lobe.hue},80%,50%)`;
            ctx.stroke();
        }

        // Glowing lobe pupil
        const pulse = 0.7 + Math.sin(t * 2.5) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.shadowBlur  = 22;
        ctx.shadowColor = `hsl(${lobe.hue},90%,60%)`;
        ctx.fillStyle   = `hsl(${lobe.hue},80%,70%)`;
        ctx.beginPath();
        ctx.arc(lobe.x, lobe.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Serpentine tendrils following the figure-8 path
    const tendrilCount = 3;
    for (let tn = 0; tn < tendrilCount; tn++) {
        const offset = tn / tendrilCount;
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = `hsl(${270 + tn * 15},85%,70%)`;
        ctx.lineWidth   = 1.2;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#7733ff';
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
            const frac  = i / 80;
            const angle = (frac + offset + t * 0.25) * Math.PI * 2;
            const s     = Math.sin(angle);
            const lx    = cx + Math.cos(angle) * r * 0.85;
            const ly    = cy + s * Math.cos(angle) * r * 0.85;
            i === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(lx, ly);
        }
        ctx.stroke();
    }

    // Binding line connecting the two lobe pupils
    ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.2;
    ctx.strokeStyle = 'rgba(180,120,255,0.8)';
    ctx.lineWidth   = 1;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = '#aa88ff';
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -t * 20;
    ctx.beginPath();
    ctx.moveTo(lobes[0].x, lobes[0].y);
    ctx.lineTo(lobes[1].x, lobes[1].y);
    ctx.stroke();
    ctx.setLineDash([]);
}

// ── rune glyphs (small HUD sigil drawn at center) ─────────────────────────────
export function drawRuneGlyph(ctx, spell, cx, cy, now, alpha = 1) {
    const fn = {
        circle:      runeCircle,
        zigzag:      runeZigzag,
        spiral:      runeSpiral,
        line:        runeLine,
        triangle:    runeTriangle,
        v:           runeV,
        z:           runeZ,
        figureeight: runeFigureEight,
    }[spell];
    if (!fn) return;

    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.globalCompositeOperation = 'screen';
    ctx.translate(cx, cy);
    ctx.rotate(now / 3400);
    fn(ctx, now);
    ctx.restore();
}

function runeCircle(ctx) {
    ctx.strokeStyle = '#44ccff';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#00eeff';
    ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
        ctx.lineTo(Math.cos(a) * 36, Math.sin(a) * 36);
        ctx.stroke();
    }
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18)
                : ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
    }
    ctx.closePath(); ctx.stroke();
}

function runeZigzag(ctx) {
    ctx.strokeStyle = '#ffee22';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 16;
    ctx.shadowColor = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(10, -28); ctx.lineTo(-5, -4); ctx.lineTo(8, -4); ctx.lineTo(-10, 28);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 22, Math.sin(a) * 22);
        ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
        ctx.stroke();
    }
}

function runeSpiral(ctx) {
    ctx.strokeStyle = '#cc44ff';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 13;
    ctx.shadowColor = '#dd00ff';
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * Math.PI * 4;
        const r = 1.5 + t * 3.8;
        i === 0 ? ctx.moveTo(Math.cos(t) * r, Math.sin(t) * r)
                : ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 33, 0, Math.PI * 2); ctx.stroke();
}

function runeLine(ctx) {
    ctx.strokeStyle = '#ff6633';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 15;
    ctx.shadowColor = '#ff3300';
    ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.stroke();
    for (const x of [-18, 0, 18]) {
        ctx.beginPath(); ctx.moveTo(x, -9); ctx.lineTo(x, 9); ctx.stroke();
    }
}

function runeTriangle(ctx) {
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#ff0000';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        i === 0 ? ctx.moveTo(Math.cos(a) * 32, Math.sin(a) * 32)
                : ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
    }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
}

function runeV(ctx) {
    ctx.strokeStyle = '#44ffaa';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 13;
    ctx.shadowColor = '#00ffcc';
    ctx.beginPath();
    ctx.moveTo(-22, -20); ctx.lineTo(0, 20); ctx.lineTo(22, -20);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 20, 5, 0, Math.PI * 2); ctx.stroke();
}

function runeZ(ctx) {
    ctx.strokeStyle = '#ffaa33';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(20, -20); ctx.lineTo(-20, -20);
    ctx.lineTo(20, 20);  ctx.lineTo(-20, 20);
    ctx.stroke();
}

function runeFigureEight(ctx) {
    ctx.strokeStyle = '#aa88ff';
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#7733ff';
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
        const t = (i / 80) * Math.PI * 2;
        const s = Math.sin(t);
        const x = Math.cos(t) * 24;
        const y = s * Math.cos(t) * 18;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (const ox of [-14, 14]) {
        ctx.beginPath(); ctx.arc(ox, 0, 5, 0, Math.PI * 2); ctx.stroke();
    }
}
