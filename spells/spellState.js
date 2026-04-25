const state = {
  status: 'idle',
  activeSpell: null,
};

export function updateSpellState(changes) {
  Object.assign(state, changes);
  console.log('Spell state updated:', state);
}

export function getSpellState() {
  return { ...state };
}
