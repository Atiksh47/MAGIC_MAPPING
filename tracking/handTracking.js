import { updateSpellState } from '../spells/spellState.js';

export async function startHandTracking(scene, recognizer) {
  console.log('Starting hand tracking...');
  updateSpellState({ status: 'initialized' });

  // Placeholder: replace with real camera/hand tracking initialization
  const fakeFrame = { hands: [] };
  scene.renderFrame(fakeFrame);
  recognizer.listen(fakeFrame);
}
