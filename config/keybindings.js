import { isMac } from './is-mac';

const altInMac = '⌥'; // option

export function keyDisplayValue(key) {
  if (key.includes('Mod')) {
    key = key.split('Mod').join(isMac ? '⌘' : 'Ctrl');
  }

  key = key
    .split('-')
    .map((r) => {
      if (/^[A-Z]$/.test(r)) {
        return `Shift-${r.toLocaleLowerCase()}`;
      }
      return r;
    })
    .join('-');

  if (key.includes('Shift')) {
    key = key.split('Shift').join('⇧');
  }
  return key;
}

class KeyBinding {
  constructor({ key }) {
    this.key = key;
  }
  get displayValue() {
    return keyDisplayValue(this.key);
  }
}

export const keybindings = {
  toggleSecondaryEditor: new KeyBinding({
    key: 'Mod-\\',
  }),
  toggleCommandPalette: new KeyBinding({
    key: 'Mod-P',
  }),
  toggleFilePalette: new KeyBinding({
    key: 'Mod-p',
  }),
  toggleWorkspacePalette: new KeyBinding({
    key: 'Ctrl-r',
  }),
  toggleFileBrowser: new KeyBinding({
    key: 'Mod-e',
  }),
};