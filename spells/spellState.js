// Phase flow: idle → drawing → flash → active → fading → idle
// "flash" is a brief bright conversion moment (no charge bar needed)
const FLASH_MS  = 320;
const ACTIVE_MS = 3000;
const FADE_MS   = 1100;

const state = {
    phase: 'idle',        // idle | drawing | flash | active | fading
    spell: 'neutral',
    flashProgress: 0,     // 0→1 during flash
    rawPath: [],
    center: { x: 0.5, y: 0.5 },
    phaseStart: 0
};

export function startDrawing() {
    state.phase         = 'drawing';
    state.spell         = 'neutral';
    state.rawPath       = [];
    state.flashProgress = 0;
}

export function addDrawPoint(point) {
    state.rawPath.push(point);
}

export function resolveSpell(spell, rawPath) {
    state.spell   = spell;
    state.rawPath = rawPath;

    if (rawPath.length > 0) {
        state.center.x = rawPath.reduce((s, p) => s + p.x, 0) / rawPath.length;
        state.center.y = rawPath.reduce((s, p) => s + p.y, 0) / rawPath.length;
    }

    state.phaseStart    = performance.now();
    state.flashProgress = 0;

    if (spell === 'neutral') {
        state.phase = 'fading';
    } else {
        state.phase = 'flash';
    }
}

export function tickState(now) {
    if (state.phase === 'flash') {
        state.flashProgress = Math.min(1, (now - state.phaseStart) / FLASH_MS);
        if (state.flashProgress >= 1) {
            state.phase      = 'active';
            state.phaseStart = now;
        }
    } else if (state.phase === 'active') {
        if ((now - state.phaseStart) >= ACTIVE_MS) {
            state.phase      = 'fading';
            state.phaseStart = now;
        }
    } else if (state.phase === 'fading') {
        if ((now - state.phaseStart) >= FADE_MS) {
            state.phase   = 'idle';
            state.spell   = 'neutral';
            state.rawPath = [];
        }
    }

    return state;
}

export function getState() { return state; }
