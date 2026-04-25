import { loadSpellTemplates } from './templates.js';

export function createSpellRecognizer() {
  const templates = loadSpellTemplates();

  return {
    listen(frame) {
      console.log('Recognizing spells on frame', frame);
      // Placeholder logic for matching gestures against templates
      const detected = templates.length > 0 ? templates[0].name : null;
      if (detected) {
        console.log(`Detected spell: ${detected}`);
      }
      return detected;
    },
  };
}
