import * as THREE from 'three';

const MAX_PTS = 512;

// Three passes of the same geometry at different widths/opacities simulate glow.
// (WebGL LineBasicMaterial doesn't support linewidth > 1 on most drivers,
// so we layer three Lines with decreasing opacity instead.)
let geoCore, geoMid, geoOuter;
let lineCore, lineMid, lineOuter;
let positions;   // shared Float32Array written each frame

const SPELL_COLOR = {
    circle:      new THREE.Color('#44ccff'),
    zigzag:      new THREE.Color('#ffee22'),
    spiral:      new THREE.Color('#cc44ff'),
    line:        new THREE.Color('#ff6633'),
    triangle:    new THREE.Color('#ff4444'),
    v:           new THREE.Color('#44ffaa'),
    z:           new THREE.Color('#ffaa33'),
    figureeight: new THREE.Color('#aa88ff'),
    neutral:     new THREE.Color('#8888ff'),
};

function makeLine(color, opacity) {
    const geo = new THREE.BufferGeometry();
    const buf = new THREE.BufferAttribute(new Float32Array(MAX_PTS * 3), 3);
    buf.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', buf);
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    return { line: new THREE.Line(geo, mat), geo };
}

export function initDrawPath(scene) {
    positions = new Float32Array(MAX_PTS * 3);

    const r0 = makeLine(0xffffff, 0.95);   // bright white core
    const r1 = makeLine(0x88ccff, 0.45);   // mid glow
    const r2 = makeLine(0x4488ff, 0.18);   // outer halo

    lineCore  = r0.line; geoCore  = r0.geo;
    lineMid   = r1.line; geoMid   = r1.geo;
    lineOuter = r2.line; geoOuter = r2.geo;

    // Scale mid/outer so they appear wider via object scale
    lineMid.scale.set(1.002, 1.002, 1);
    lineOuter.scale.set(1.005, 1.005, 1);

    scene.add(lineOuter, lineMid, lineCore);
}

export function updateDrawPath(rawPath, phase, flashProgress, normToWorld) {
    if (!rawPath || rawPath.length < 2) return;

    const count = Math.min(rawPath.length, MAX_PTS);

    for (let i = 0; i < count; i++) {
        const w = normToWorld(rawPath[i].x, rawPath[i].y);
        positions[i*3]   = w.x;
        positions[i*3+1] = w.y;
        positions[i*3+2] = 0.05;
    }

    for (const geo of [geoCore, geoMid, geoOuter]) {
        const buf = geo.attributes.position;
        buf.array.set(positions.subarray(0, count * 3));
        buf.needsUpdate = true;
        geo.setDrawRange(0, count);
    }

    // During flash, flare the core white and boost opacity
    const flashBoost = phase === 'flash' ? flashProgress : 0;
    lineCore.material.opacity  = 0.95 + flashBoost * 0.05;
    lineMid.material.opacity   = 0.45 + flashBoost * 0.45;
    lineOuter.material.opacity = 0.18 + flashBoost * 0.52;

    // Tint mid/outer toward spell color (or white on flash)
    // (core stays white always for the hot-wire look)
    const flashWhite = flashBoost;
    lineMid.material.color.setRGB(
        0.53 + flashWhite * 0.47,
        0.80 + flashWhite * 0.20,
        1.00
    );
}

export function clearDrawPath() {
    for (const geo of [geoCore, geoMid, geoOuter]) {
        geo.setDrawRange(0, 0);
    }
}
