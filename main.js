import { initScene } from './rendering/scene.js';
import { startHandTracking } from './tracking/handTracking.js';
import { createSpellRecognizer } from './spells/recognizer.js';

const canvas = document.getElementById('magic-canvas');

function main() {
  const scene = initScene(canvas);
  const recognizer = createSpellRecognizer();
  startHandTracking(scene, recognizer);
}

window.addEventListener('DOMContentLoaded', main);
