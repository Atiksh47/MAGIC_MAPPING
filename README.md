# Magic Mapping — Hand-Tracked Spell Casting

An interactive hand-tracking particle experience built with Canvas 2D and MediaPipe. Draw magical symbols in the air using your webcam and hand gestures to cast spells — unleash your inner wizard.

---

## Demo

Open `index.html` in a browser, allow webcam access, and draw spell patterns.

---

## Spells

| Pattern | Spell | Visual Effect |
|---|---|---|
| ⭕ Circle | **Aegis Rune** | Cyan Fibonacci sphere shell with shimmering protection aura |
| ⚡ Zigzag | **Volt Sigil** | Yellow recursive lightning tree with branching electric bolts |
| 🌀 Spiral | **Vortex Seal** | Purple contracting 3D helix that spirals inward and upward |
| ➖ Line | **Rift Slash** | Orange fractured plane splitting into two halves with edge glow |
| △ Triangle | **Primordial Flame** | Red tetrahedron with rising fire column and hot particle trails |
| Ⓥ V-Shape | **Runic Wings** | Green swept wing pair flowing outward with elegant curves |
| Z | **Glyph of Binding** | Orange glowing lattice cube with orbiting face-center rings |
| ∞ Figure-8 | **Serpent's Eye** | Purple lemniscate torus with flowing figure-eight pattern |

---

## How It Works

### Stack
- **Three.js + WebGL** — High-performance 3D particle rendering with custom shaders and additive blending
- **[MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)** — real-time hand landmark detection (21 keypoints per hand)
- **Custom Particle System** — 20,000 GPU-accelerated particles with ambient drift and spell-specific effects
- No build step — modular JavaScript files, all dependencies via CDN

### Particle System
20,000 GPU-accelerated particles rendered via Three.js with custom GLSL shaders. The ambient state drifts particles in a Fibonacci sphere pattern. When spells are cast, particles smoothly interpolate to spell-specific formations with staggered delays for elegant transitions. Each spell has a unique 3D geometry and color palette.

### Spell Recognition
Pinch your thumb and index finger to start drawing a path. Release to recognize the spell based on shape matching against predefined templates. Uses rotational-invariant path distance matching with a similarity threshold of 0.65.

Phases: drawing → flash (0.32s) → active (3.0s) → fading (1.1s).

---

## Running Locally

No install required. Just open the file:

```bash
# Option 1 — direct file open
open index.html    # macOS
start index.html   # Windows

# Option 2 — local server (recommended for some browsers)
npx serve .
# or
python -m http.server 8080
```

> **Note:** Chrome and Edge work best. A webcam is required.

---

## Project Structure

```
magic_mapping/
├── index.html
├── styles.css
├── main.js              # entry point
├── tracking/
│   └── handTracking.js
├── spells/
│   ├── recognizer.js
│   ├── spellState.js
│   └── templates.js
├── rendering/
│   ├── scene.js
│   ├── particles.js
│   ├── drawPath.js
│   └── spellParticles.js
└── utils/
    ├── math.js
    └── audio.js
```

---

## Inspired By

- Harry Potter series (Warner Bros.)
- Avatar: The Last Airbender (Nickelodeon)
- Interactive gesture-based magic systems in games