import { initParticles, updateParticles } from './particles.js';
import { drawEnergyRibbon, drawSpellEffect } from './effects.js';
import { tickState, getState } from '../spells/spellState.js';

let canvas, ctx;
let cursor = null;      // { x, y } in [0,1] normalized, or null
let cursorPinching = false;

export function initScene() {
    canvas = document.getElementById('magic-canvas');
    ctx    = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    ctx.fillStyle = '#070813';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    initParticles(canvas);
}

function resize() {
    const rect    = canvas.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    ctx.fillStyle = '#070813';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function animate() {
    requestAnimationFrame(animate);

    const now   = performance.now();
    const state = tickState(now);
    const W     = canvas.width;
    const H     = canvas.height;
    const view  = { width: W, height: H };

    // Fade-trail: paint dark overlay instead of clearing
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle   = 'rgba(7, 8, 19, 0.18)';
    ctx.fillRect(0, 0, W, H);

    updateParticles(ctx, state, now);

    if (state.phase !== 'idle' && state.rawPath.length > 1)
        drawEnergyRibbon(ctx, state, view);

    if (state.phase === 'flash' || state.phase === 'active' || state.phase === 'fading')
        drawSpellEffect(ctx, state, view, now);

    drawHUD(ctx, state, W, H, now);
    drawCursor(ctx, W, H);
}

export function setCursor(pt, pinching) {
    cursor         = pt;
    cursorPinching = pinching;
}

function drawCursor(ctx, W, H) {
    if (!cursor) return;
    const cx = cursor.x * W, cy = cursor.y * H;
    const r  = cursorPinching ? 6 : 10;
    const color = cursorPinching ? '#ffffff' : '#4488ff';

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = cursorPinching ? 1 : 0.7;
    ctx.shadowBlur  = cursorPinching ? 20 : 10;
    ctx.shadowColor = cursorPinching ? '#ffffff' : '#2255cc';
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // crosshair lines
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.6, cy); ctx.lineTo(cx - r * 0.4, cy);
    ctx.moveTo(cx + r * 0.4, cy); ctx.lineTo(cx + r * 1.6, cy);
    ctx.moveTo(cx, cy - r * 1.6); ctx.lineTo(cx, cy - r * 0.4);
    ctx.moveTo(cx, cy + r * 0.4); ctx.lineTo(cx, cy + r * 1.6);
    ctx.stroke();
    ctx.restore();
}

const SPELL_LABEL = {
    circle:      'Aegis Rune',
    zigzag:      'Volt Sigil',
    spiral:      'Vortex Seal',
    line:        'Rift Slash',
    triangle:    'Primordial Flame',
    v:           'Runic Wings',
    z:           'Glyph of Binding',
    figureeight: "Serpent's Eye",
};
const HUD_COLOR = {
    circle:      '#44ccff',
    zigzag:      '#ffee22',
    spiral:      '#cc44ff',
    line:        '#ff6633',
    triangle:    '#ff4444',
    v:           '#44ffaa',
    z:           '#ffaa33',
    figureeight: '#aa88ff',
};

function drawHUD(ctx, state, W, H) {
    if (state.phase === 'idle' || state.phase === 'drawing') return;

    const label = SPELL_LABEL[state.spell];
    if (!label) return;

    let alpha = 1;
    if (state.phase === 'flash')  alpha = state.flashProgress;
    if (state.phase === 'fading') alpha = Math.max(0, 1 - (performance.now() - state.phaseStart) / 1100);

    const color = HUD_COLOR[state.spell] ?? '#aaaaff';

    ctx.save();
    ctx.globalAlpha              = alpha * 0.9;
    ctx.globalCompositeOperation = 'source-over';
    ctx.font                     = 'bold 22px monospace';
    ctx.textAlign                = 'center';
    ctx.textBaseline             = 'bottom';
    ctx.shadowBlur               = 18;
    ctx.shadowColor              = color;
    ctx.fillStyle                = color;
    ctx.fillText(label, W / 2, H - 28);
    ctx.restore();
}
