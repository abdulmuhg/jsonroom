import { describe, it, expect } from 'vitest';
import { isEditableTarget, matchShortcut, type ShortcutEvent } from './shortcuts';

function ev(partial: Partial<ShortcutEvent>): ShortcutEvent {
  return { key: '', code: '', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...partial };
}

describe('matchShortcut', () => {
  it('maps Ctrl+F and Cmd+F to search', () => {
    expect(matchShortcut(ev({ key: 'f', code: 'KeyF', ctrlKey: true }))).toBe('search');
    expect(matchShortcut(ev({ key: 'f', code: 'KeyF', metaKey: true }))).toBe('search');
  });

  it('maps Ctrl+D and Cmd+D to compare', () => {
    expect(matchShortcut(ev({ key: 'd', code: 'KeyD', ctrlKey: true }))).toBe('compare');
    expect(matchShortcut(ev({ key: 'd', code: 'KeyD', metaKey: true }))).toBe('compare');
  });

  it('maps Alt+T to a new tab and Alt+W to closing the tab', () => {
    expect(matchShortcut(ev({ key: 't', code: 'KeyT', altKey: true }))).toBe('newTab');
    expect(matchShortcut(ev({ key: 'w', code: 'KeyW', altKey: true }))).toBe('closeTab');
  });

  it('matches Option+T on macOS, where the key is a typed symbol', () => {
    expect(matchShortcut(ev({ key: '†', code: 'KeyT', altKey: true }))).toBe('newTab');
    expect(matchShortcut(ev({ key: '∑', code: 'KeyW', altKey: true }))).toBe('closeTab');
  });

  it('matches by key on non-QWERTY layouts', () => {
    // AZERTY: the physical Z key types "w".
    expect(matchShortcut(ev({ key: 'w', code: 'KeyZ', altKey: true }))).toBe('closeTab');
    expect(matchShortcut(ev({ key: 'f', code: 'KeyF', ctrlKey: true }))).toBe('search');
  });

  it('ignores uppercase keys from Caps Lock', () => {
    expect(matchShortcut(ev({ key: 'F', code: 'KeyF', ctrlKey: true }))).toBe('search');
  });

  it('leaves browser-reserved combos alone', () => {
    expect(matchShortcut(ev({ key: 't', code: 'KeyT', ctrlKey: true }))).toBeNull();
    expect(matchShortcut(ev({ key: 'w', code: 'KeyW', ctrlKey: true }))).toBeNull();
  });

  it('does not fire with extra modifiers', () => {
    expect(matchShortcut(ev({ key: 'f', code: 'KeyF', ctrlKey: true, shiftKey: true }))).toBeNull();
    expect(matchShortcut(ev({ key: 'd', code: 'KeyD', ctrlKey: true, altKey: true }))).toBeNull();
    expect(matchShortcut(ev({ key: 't', code: 'KeyT', altKey: true, shiftKey: true }))).toBeNull();
  });

  it('does not treat AltGr (reported as Ctrl+Alt) as an Alt shortcut', () => {
    expect(matchShortcut(ev({ key: 't', code: 'KeyT', altKey: true, ctrlKey: true }))).toBeNull();
    expect(matchShortcut(ev({ key: 'w', code: 'KeyW', altKey: true, ctrlKey: true }))).toBeNull();
  });

  it('ignores plain keys', () => {
    expect(matchShortcut(ev({ key: 'f', code: 'KeyF' }))).toBeNull();
    expect(matchShortcut(ev({ key: 't', code: 'KeyT' }))).toBeNull();
  });
});

describe('isEditableTarget', () => {
  it('flags text fields', () => {
    expect(isEditableTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isEditableTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('passes everything else', () => {
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: false })).toBe(false);
    expect(isEditableTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget({})).toBe(false);
  });
});
