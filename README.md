# Magic Mapping — Hand-Tracked Spell Casting

An interactive hand-tracking particle experience built with Canvas 2D and MediaPipe. Draw magical symbols in the air using your webcam and hand gestures to cast spells — unleash your inner wizard.

---

## Demo

Open `index.html` in a browser, allow webcam access, and draw spell patterns.

---

## Spells

| Pattern | Spell | Visual Effect |
|---|---|---|
| ⭕ Circle | **Aqua Vortex** | Blue energy ribbons spiral outward with glowing particles |
| ⚡ Zigzag | **Lightning Bolt** | Yellow jagged bolts crackle with electric sparks |
| 🌀 Spiral | **Fire Storm** | Purple flames twist upward in a fiery whirlwind |
| ➖ Line | **Earth Wall** | Orange stone pillars erupt in a straight formation |
| Neutral | **Neutral** | Soft blue aura with ambient floating particles |

---

## How It Works

### Stack
- **Canvas 2D API** — 2D particle rendering with additive blending and trail effects
- **[MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)** — real-time hand landmark detection (21 keypoints per hand)
- **Custom Particle System** — Ambient particles and spell-specific effects with dynamic colors
- No build step — modular JavaScript files, all dependencies via CDN

### Particle System
70 ambient particles float upward continuously. Spell casting adds targeted particles with colors matching the spell type (blue for circle, yellow for zigzag, etc.). Particles use velocity-based movement with life cycles for smooth animations.

### Spell Recognition
Pinch your thumb and index finger to start drawing a path. Release to recognize the spell based on shape matching against predefined templates. Uses dynamic time warping for path comparison with a similarity threshold of 0.38.

Phases: drawing → charging (1.2s) → active (2.2s) → fading (0.9s).

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
│   ├── templates.js
│   └── spellState.js
├── rendering/
│   ├── scene.js
│   ├── particles.js
│   └── effects.js
└── utils/
    └── math.js
```

---

## Inspired By

- Harry Potter series (Warner Bros.)
- Avatar: The Last Airbender (Nickelodeon)
- Interactive gesture-based magic systems in games