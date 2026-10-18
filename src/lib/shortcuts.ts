/**
 * Keyboard shortcuts for the workspace.
 *
 * Browsers never deliver Ctrl/⌘+T or Ctrl/⌘+W to a page — they open and close
 * browser tabs — so JSONRoom's own tab shortcuts use Alt (Option on macOS).
 * Ctrl/⌘+F and Ctrl/⌘+D do reach the page and can be taken over.
 */

export type Shortcut = 'search' | 'compare' | 'newTab' | 'closeTab';

export type ShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'
>;

/** Labels for tooltips, kept beside the bindings so they can't drift apart. */
export const SHORTCUT_LABELS: Record<Shortcut, string> = {
  search: '⌘/Ctrl + F',
  compare: '⌘/Ctrl + D',
  newTab: 'Alt + T',
  closeTab: 'Alt + W',
};

/**
 * The letter the user meant. Usually `key`, but with Option held macOS reports
 * the typed symbol (Option+T is "†"), so fall back to the physical key.
 */
function letterOf(e: ShortcutEvent): string {
  if (/^[a-z]$/i.test(e.key)) return e.key.toLowerCase();
  const m = /^Key([A-Z])$/.exec(e.code);
  return m ? m[1].toLowerCase() : '';
}

/**
 * True when the event comes from a text field. The tab shortcuts stand down
 * there: Option+T/W type characters on macOS, and Alt+W mid-paste would close
 * the tab and lose what was typed.
 */
export function isEditableTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as { tagName?: string; isContentEditable?: boolean };
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

export function matchShortcut(e: ShortcutEvent): Shortcut | null {
  if (e.shiftKey) return null;
  const letter = letterOf(e);
  const meta = e.metaKey || e.ctrlKey;

  if (meta && !e.altKey) {
    if (letter === 'f') return 'search';
    if (letter === 'd') return 'compare';
    return null;
  }

  // AltGr arrives as Ctrl+Alt on Windows; it types characters, so skip it.
  if (e.altKey && !meta) {
    if (letter === 't') return 'newTab';
    if (letter === 'w') return 'closeTab';
  }
  return null;
}
