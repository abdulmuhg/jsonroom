import { describe, it, expect } from 'vitest';
import { THEMES } from '../hooks/useTheme';
import css from './index.css?raw';
import html from '../../index.html?raw';

/** The `--name: value` pairs declared in a `[data-theme='id']` block. */
function tokensFor(theme: string): Record<string, string> {
  const block = new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`).exec(css);
  if (!block) throw new Error(`no [data-theme='${theme}'] block in index.css`);
  const tokens: Record<string, string> = {};
  for (const m of block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme tokens', () => {
  it('every theme defines the same tokens as the default', () => {
    const expected = Object.keys(tokensFor('default')).sort();
    for (const t of THEMES) expect(Object.keys(tokensFor(t)).sort(), t).toEqual(expected);
  });

  it('the startup script in index.html accepts every theme', () => {
    for (const t of THEMES) expect(html, t).toContain(`'${t}'`);
  });

  describe.each(['plain-dark', 'plain-light'])('%s', (theme) => {
    const tk = tokensFor(theme);

    it.each(['accent-key', 'accent-string', 'accent-number', 'accent-bool', 'ink-primary', 'ink-secondary'])(
      '%s reads at WCAG AA (4.5:1) on the page background',
      (name) => {
        expect(contrast(tk[`color-${name}`], tk['color-bg-base'])).toBeGreaterThanOrEqual(4.5);
      },
    );

    it('muted text stays legible on panels (3:1)', () => {
      expect(contrast(tk['color-ink-muted'], tk['color-bg-panel'])).toBeGreaterThanOrEqual(3);
    });
  });
});
