import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { initParticles, updateParticles, triggerSpell, resetToAmbient } from './particles.js';
import { initDrawPath, updateDrawPath, clearDrawPath }                   from './drawPath.js';
import { tickState }                                                      from '../spells/spellState.js';

// ── Three.js core ──────────────────────────────────────────────────────────────
let renderer, camera, scene, composer, bloomPass;

// ── Cursor state ───────────────────────────────────────────────────────────────
const cursorData = { pt: null, pinching: false };
let cursorTorus, cursorSphere;

// ── HUD ────────────────────────────────────────────────────────────────────────
const hudEl = document.getElementById('hud');
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

// ── Spell phase tracking for one-shot triggers ─────────────────────────────────
let lastPhase = 'idle';

// ── Ray-plane unprojection: [0,1]² → Three.js world space at z=0 ──────────────
export function normToWorld(nx, ny) {
    const ndcX =  nx * 2 - 1;
    const ndcY = -(ny * 2 - 1);
    const vec  = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const dir  = vec.sub(camera.position).normalize();
    const t    = -camera.position.z / dir.z;
    return new THREE.Vector3(
        camera.position.x + dir.x * t,
        camera.position.y + dir.y * t,
        0
    );
}

// ── Init ───────────────────────────────────────────────────────────────────────
export function initScene() {
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('app').appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;

    // Scene
    scene = new THREE.Scene();

    // Post-processing
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.0,   // strength
        0.5,   // radius
        0.1    // threshold
    );
    composer.addPass(bloomPass);

    // Cursor meshes
    const torusGeo  = new THREE.TorusGeometry(0.18, 0.025, 8, 32);
    const sphereGeo = new THREE.SphereGeometry(0.08, 12, 8);
    const cursorMat = (hex) => new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    cursorTorus  = new THREE.Mesh(torusGeo,  cursorMat(0x4488ff));
    cursorSphere = new THREE.Mesh(sphereGeo, cursorMat(0xffffff));
    cursorTorus.visible  = false;
    cursorSphere.visible = false;
    scene.add(cursorTorus, cursorSphere);

    // Subsystems
    initParticles(scene);
    initDrawPath(scene);

    window.addEventListener('resize', onResize);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
}

// ── Cursor (called from main.js) ───────────────────────────────────────────────
export function setCursor(pt, pinching) {
    cursorData.pt       = pt;
    cursorData.pinching = pinching;
}

// ── Animate ────────────────────────────────────────────────────────────────────
export function animate() {
    requestAnimationFrame(animate);

    const now   = performance.now();
    const state = tickState(now);

    // ── One-shot phase triggers ──────────────────────────────────────────────
    if (state.phase !== lastPhase) {
        if (state.phase === 'flash' && state.spell !== 'neutral') {
            triggerSpell(state.spell, state);
        }
        if (state.phase === 'fading') {
            resetToAmbient();
        }
        if (state.phase === 'idle') {
            clearDrawPath();
        }
        lastPhase = state.phase;
    }

    // ── Bloom strength by phase ──────────────────────────────────────────────
    if (state.phase === 'flash') {
        bloomPass.strength = 1.5 + state.flashProgress * 3.0;
    } else if (state.phase === 'active') {
        bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 2.0, 0.05);
    } else if (state.phase === 'drawing') {
        bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 1.4, 0.08);
    } else {
        bloomPass.strength = THREE.MathUtils.lerp(bloomPass.strength, 1.0, 0.05);
    }

    // ── Draw path line ───────────────────────────────────────────────────────
    if (state.phase !== 'idle') {
        updateDrawPath(state.rawPath, state.phase, state.flashProgress ?? 0, normToWorld);
    }

    // ── Particles ────────────────────────────────────────────────────────────
    updateParticles(now, state);

    // ── Cursor ───────────────────────────────────────────────────────────────
    cursorTorus.visible  = false;
    cursorSphere.visible = false;
    if (cursorData.pt) {
        const w = normToWorld(cursorData.pt.x, cursorData.pt.y);
        if (cursorData.pinching) {
            cursorSphere.visible = true;
            cursorSphere.position.lerp(w.setZ(0.1), 0.35);
        } else {
            cursorTorus.visible = true;
            cursorTorus.position.lerp(w.setZ(0.1), 0.35);
            cursorTorus.rotation.z += 0.04;
        }
    }

    // ── HUD ──────────────────────────────────────────────────────────────────
    updateHUD(state);

    composer.render();
}

function updateHUD(state) {
    if (state.phase === 'idle' || state.phase === 'drawing' || state.spell === 'neutral') {
        hudEl.style.opacity = '0';
        return;
    }
    const label = SPELL_LABEL[state.spell];
    const color = HUD_COLOR[state.spell] ?? '#aaaaff';
    if (!label) { hudEl.style.opacity = '0'; return; }

    hudEl.textContent = label;
    hudEl.style.setProperty('--hud-color', color);

    if (state.phase === 'flash') {
        hudEl.style.opacity = String(state.flashProgress * 0.9);
    } else if (state.phase === 'active') {
        hudEl.style.opacity = '0.9';
    } else if (state.phase === 'fading') {
        const age = (performance.now() - state.phaseStart) / 1100;
        hudEl.style.opacity = String(Math.max(0, 1 - age) * 0.9);
    }
}
