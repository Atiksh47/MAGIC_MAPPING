import { renderParticles } from './particles.js';
import { applyEffects } from './effects.js';

export function initScene(canvas) {
  const context = canvas.getContext('2d');

  function renderFrame(frame) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    renderParticles(context, frame);
    applyEffects(context, frame);
  }

  return { renderFrame };
}
