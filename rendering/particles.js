const SPELL_HUE = {
    circle:      195,
    zigzag:       50,
    spiral:      280,
    line:         15,
    triangle:      0,
    v:           160,
    z:            30,
    figureeight: 265,
};
const MAX_SPELL = 400;

let canvas;
let particles = [];

export function initParticles(c) {
    canvas = c;
    for (let i = 0; i < 70; i++) particles.push(mkAmbient());
}

// ── factories ────────────────────────────────────────────────────────────────

function mkAmbient() {
    return {
        type: 'ambient',
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0002,
        vy: -(Math.random() * 0.0002 + 0.00005),
        life: Math.random(), maxLife: 0.6 + Math.random() * 0.8,
        r: 0.4 + Math.random() * 1.2
    };
}

function mkSpell(cx, cy, spell) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 0.001 + Math.random() * 0.003;
    const h     = SPELL_HUE[spell] ?? 200;
    const dist  = 0.03 + Math.random() * 0.07;
    return {
        type: 'spell', spell,
        x: cx + (Math.random() - 0.5) * dist,
        y: cy + (Math.random() - 0.5) * dist,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0, maxLife: 0.3 + Math.random() * 0.5,
        r: 1.5 + Math.random() * 3,
        h, s: 90, l: 65
    };
}

// ── main update ──────────────────────────────────────────────────────────────

export function updateParticles(ctx, state, now) {
    const W = canvas.width, H = canvas.height;

    // Spawn spell particles during flash / active
    const spawning = state.phase === 'flash' || state.phase === 'active';
    if (spawning && particles.filter(p => p.type === 'spell').length < MAX_SPELL) {
        // Burst more particles on flash, steady stream while active
        const count = state.phase === 'flash'
            ? Math.floor(8 + state.flashProgress * 20)
            : 6;
        for (let i = 0; i < count; i++)
            particles.push(mkSpell(state.center.x, state.center.y, state.spell));
    }

    const dt = 0.016;
    ctx.save();

    particles = particles.filter(p => {
        p.life += dt;

        if (p.type === 'ambient') {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
            if (p.life >= p.maxLife) { particles.push(mkAmbient()); return false; }

            const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.35;
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = a;
            ctx.fillStyle   = '#7090ff';
            ctx.beginPath();
            ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
            ctx.fill();
            return true;
        }

        if (p.type === 'spell') {
            p.x += p.vx; p.y += p.vy;
            if (p.life >= p.maxLife) return false;

            const a    = Math.sin((p.life / p.maxLife) * Math.PI) * 0.9;
            const glow = 8;
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = a;
            ctx.shadowBlur  = glow;
            ctx.shadowColor = `hsl(${p.h},${p.s}%,${p.l}%)`;
            ctx.fillStyle   = `hsl(${p.h},${p.s}%,${p.l}%)`;
            ctx.beginPath();
            ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
            ctx.fill();
            return true;
        }

        return false;
    });

    ctx.restore();
}
