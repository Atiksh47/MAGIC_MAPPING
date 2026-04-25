import { initScene, animate, setCursor } from './rendering/scene.js';
import { startTracking } from './tracking/handTracking.js';
import { recognizeSpell } from './spells/recognizer.js';
import { startDrawing, addDrawPoint, resolveSpell } from './spells/spellState.js';

const PINCH_ON      = 0.07;   // threshold to start/continue drawing
const PINCH_OFF     = 0.10;   // threshold to release (hysteresis prevents flicker)
const MIN_MOVE      = 0.004;  // minimum movement to add a new path point

let path      = [];
let isDrawing = false;
let openFrames = 0;            // consecutive open-hand frames before releasing
const OPEN_FRAMES_NEEDED = 3; // debounce: ignore single noisy open frames

function main() {
    initScene();
    animate();

    startTracking((landmarks) => {
        const lm = landmarks[0];

        // No hand visible — show no cursor, let drawing release after debounce
        if (!lm) {
            setCursor(null, false);
            if (isDrawing) {
                openFrames++;
                if (openFrames >= OPEN_FRAMES_NEEDED) commitDraw();
            }
            return;
        }

        const tip   = { x: 1 - lm[8].x, y: lm[8].y };  // index finger tip (mirrored)
        const pinch = Math.hypot(lm[8].x - lm[4].x, lm[8].y - lm[4].y);

        const isPinching = isDrawing ? pinch < PINCH_OFF : pinch < PINCH_ON;
        setCursor(tip, isPinching);

        if (isPinching) {
            openFrames = 0;
            if (!isDrawing) {
                isDrawing = true;
                path = [];
                startDrawing();
            }
            // Only add point if hand moved enough (avoids dense duplicate clusters)
            const last = path[path.length - 1];
            if (!last || Math.hypot(tip.x - last.x, tip.y - last.y) >= MIN_MOVE) {
                path.push(tip);
                addDrawPoint(tip);
            }
        } else if (isDrawing) {
            openFrames++;
            if (openFrames >= OPEN_FRAMES_NEEDED) commitDraw();
        }
    });
}

function commitDraw() {
    isDrawing  = false;
    openFrames = 0;
    const spell = recognizeSpell(path);
    resolveSpell(spell, [...path]);
    path = [];
}

window.addEventListener('DOMContentLoaded', main);
