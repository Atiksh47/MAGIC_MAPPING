export function renderParticles(context, frame) {
  context.fillStyle = 'rgba(148, 0, 211, 0.5)';
  context.beginPath();
  context.arc(150, 150, 60, 0, Math.PI * 2);
  context.fill();
}
