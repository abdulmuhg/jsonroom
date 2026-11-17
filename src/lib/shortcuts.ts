/**
 * Keyboard shortcuts for the workspace.
 *
 * Browsers never deliver Ctrl/⌘+T or Ctrl/⌘+W to a page — they open and close
 * browser tabs — so JSONRoom's own shortcuts use Alt (Option on macOS).
 * Ctrl/⌘+F and Ctrl/⌘+D do reach the page and can be taken over.
 */

export type Shortcut =
  | 'search'
  | 'compare'
  | 'newTab'
  | 'closeTab'
  | 'nextTab'
  | 'prevTab'
  | 'copyAll'
  | 'expandAll'
  | 'collapseAll'
  | 'help';

export type ShortcutGroup = 'Tabs' | 'View' | 'Edit' | 'Help';

export type ShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'
>;

interface ShortcutInfo {
  /** The key combo, as shown in tooltips and the shortcuts dialog. */
  label: string;
  description: string;
  group: ShortcutGroup;
}

/** Everything the UI shows about a shortcut, kept beside the bindings below. */
export const SHORTCUTS: Record<Shortcut, ShortcutInfo> = {
  newTab: { label: 'Alt + T', description: 'New tab', group: 'Tabs' },
  closeTab: { label: 'Alt + W', description: 'Close tab', group: 'Tabs' },
  nextTab: { label: 'Alt + ]', description: 'Next tab', group: 'Tabs' },
  prevTab: { label: 'Alt + [', description: 'Previous tab', group: 'Tabs' },
  search: { label: '⌘/Ctrl + F', description: 'Search the pane you last clicked', group: 'View' },
  compare: { label: '⌘/Ctrl + D', description: 'Toggle compare mode', group: 'View' },
  expandAll: { label: 'Alt + ↓', description: 'Expand all', group: 'View' },
  collapseAll: { label: 'Alt + ↑', description: 'Collapse all', group: 'View' },
  copyAll: { label: 'Alt + C', description: 'Copy all JSON (not in compare mode)', group: 'Edit' },
  help: { label: '?', description: 'Show keyboard shortcuts', group: 'Help' },
};

/** Labels for tooltips. */
export const SHORTCUT_LABELS = Object.fromEntries(
  Object.entries(SHORTCUTS).map(([id, info]) => [id, info.label]),
) as Record<Shortcut, string>;

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
 * True when the event comes from a text field. Most shortcuts stand down
 * there: Option+letter types characters on macOS, "?" is a character, and
 * Alt+W mid-paste would close the tab and lose what was typed.
 */
export function isEditableTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as { tagName?: string; isContentEditable?: boolean };
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

/** Search and compare use Ctrl/⌘, which never types a character, so they work anywhere. */
export function standsDownInTextField(shortcut: Shortcut): boolean {
  return shortcut !== 'search' && shortcut !== 'compare';
}

export function matchShortcut(e: ShortcutEvent): Shortcut | null {
  const meta = e.metaKey || e.ctrlKey;

  // "?" needs Shift on most layouts, so it is matched before the Shift check.
  if (e.key === '?' && !meta && !e.altKey) return 'help';

  if (e.shiftKey) return null;
  const letter = letterOf(e);

  if (meta && !e.altKey) {
    if (letter === 'f') return 'search';
    if (letter === 'd') return 'compare';
    return null;
  }

  // AltGr arrives as Ctrl+Alt on Windows; it types characters, so skip it.
  if (e.altKey && !meta) {
    if (letter === 't') return 'newTab';
    if (letter === 'w') return 'closeTab';
    if (letter === 'c') return 'copyAll';
    if (e.key === 'ArrowDown') return 'expandAll';
    if (e.key === 'ArrowUp') return 'collapseAll';
    // Option+[ types a curly quote on macOS, so go by the physical key.
    if (e.code === 'BracketRight' || e.key === ']') return 'nextTab';
    if (e.code === 'BracketLeft' || e.key === '[') return 'prevTab';
  }
  return null;
}
