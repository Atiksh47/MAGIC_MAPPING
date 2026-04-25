import * as THREE from 'three';
import { buildTargets, buildAmbientTargets } from './spellParticles.js';

const N = 20_000;

// ── Typed buffers ──────────────────────────────────────────────────────────────
const pos  = new Float32Array(N * 3);   // current xyz
const col  = new Float32Array(N * 3);   // current rgb
const siz  = new Float32Array(N);       // current size

const tPos = new Float32Array(N * 3);   // target xyz
const tCol = new Float32Array(N * 3);   // target rgb
const tSiz = new Float32Array(N);       // target size

const delay = new Float32Array(N);      // per-particle stagger delay (ms)
const startPos = new Float32Array(N * 3); // positions at transition start
const startCol = new Float32Array(N * 3);
const startSiz = new Float32Array(N);

let transitioning      = false;
let transitionStart    = 0;
const LERP_DUR         = 700;   // ms to reach target once delay elapses
const MAX_DELAY        = 500;   // ms max stagger

// ── Three.js objects ───────────────────────────────────────────────────────────
let geometry, points;

const vertShader = /* glsl */`
    attribute float size;
    varying vec3 vColor;
    void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mv.z);
        gl_Position  = projectionMatrix * mv;
    }
`;

const fragShader = /* glsl */`
    varying vec3 vColor;
    void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = 1.0 - smoothstep(0.3, 0.5, d);
        gl_FragColor = vec4(vColor * a, a);
    }
`;

// ── Easing ─────────────────────────────────────────────────────────────────────
function easeInOut(t) {
    return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
}

// ── Init ───────────────────────────────────────────────────────────────────────
export function initParticles(scene) {
    // Start in ambient state
    buildAmbientTargets(tPos, tCol, tSiz);
    pos.set(tPos); col.set(tCol); siz.set(tSiz);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos,  3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color',    new THREE.BufferAttribute(col,  3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('size',     new THREE.BufferAttribute(siz,  1).setUsage(THREE.DynamicDrawUsage));

    const material = new THREE.ShaderMaterial({
        vertexShader:   vertShader,
        fragmentShader: fragShader,
        vertexColors:   true,
        blending:       THREE.AdditiveBlending,
        depthWrite:     false,
        transparent:    true,
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);
}

// ── Trigger a spell transition ─────────────────────────────────────────────────
export function triggerSpell(spellName) {
    buildTargets(spellName, tPos, tCol, tSiz);
    beginTransition(false);
}

// ── Return to ambient ──────────────────────────────────────────────────────────
export function resetToAmbient() {
    buildAmbientTargets(tPos, tCol, tSiz);
    beginTransition(true);
}

function beginTransition(randomDelay) {
    // Snapshot current positions as the start of the lerp
    startPos.set(pos);
    startCol.set(col);
    startSiz.set(siz);

    for (let i = 0; i < N; i++) {
        delay[i] = randomDelay
            ? Math.random() * MAX_DELAY
            : Math.random() * MAX_DELAY * 0.5; // faster appearance for spells
    }

    transitionStart = performance.now();
    transitioning   = true;
}

// ── Per-frame update ───────────────────────────────────────────────────────────
export function updateParticles(now, state) {
    // Animate the point cloud rotation to match spell personality
    if (points) {
        switch (state.spell) {
            case 'circle':
                points.rotation.y += 0.006;
                break;
            case 'zigzag':
                points.rotation.y += 0.004;
                points.rotation.z  = Math.sin(now * 0.002) * 0.08;
                break;
            case 'spiral':
                points.rotation.y += 0.012;
                break;
            case 'line':
                points.rotation.z += 0.002;
                break;
            case 'triangle':
                points.rotation.y += 0.007;
                points.rotation.x += 0.003;
                break;
            case 'v':
                points.rotation.z  = Math.sin(now * 0.0008) * 0.25;
                points.rotation.y += 0.003;
                break;
            case 'z':
                points.rotation.y += 0.005;
                points.rotation.x += 0.003;
                points.rotation.z += 0.002;
                break;
            case 'figureeight':
                points.rotation.y += 0.008;
                break;
            default:
                points.rotation.y += 0.002;
                points.rotation.x += 0.001;
        }
    }

    if (!transitioning) return;

    let allDone = true;
    const elapsed = now - transitionStart;

    for (let i = 0; i < N; i++) {
        const localElapsed = elapsed - delay[i];
        if (localElapsed <= 0) { allDone = false; continue; }

        const raw = Math.min(1, localElapsed / LERP_DUR);
        const t   = easeInOut(raw);

        if (raw < 1) allDone = false;

        const i3 = i * 3;
        pos[i3]   = startPos[i3]   + (tPos[i3]   - startPos[i3])   * t;
        pos[i3+1] = startPos[i3+1] + (tPos[i3+1] - startPos[i3+1]) * t;
        pos[i3+2] = startPos[i3+2] + (tPos[i3+2] - startPos[i3+2]) * t;
        col[i3]   = startCol[i3]   + (tCol[i3]   - startCol[i3])   * t;
        col[i3+1] = startCol[i3+1] + (tCol[i3+1] - startCol[i3+1]) * t;
        col[i3+2] = startCol[i3+2] + (tCol[i3+2] - startCol[i3+2]) * t;
        siz[i]    = startSiz[i]    + (tSiz[i]    - startSiz[i])    * t;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate    = true;
    geometry.attributes.size.needsUpdate     = true;

    if (allDone) transitioning = false;
}
