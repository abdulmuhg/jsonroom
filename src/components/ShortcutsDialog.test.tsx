import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShortcutsDialog } from './ShortcutsDialog';
import { SHORTCUTS } from '../lib/shortcuts';

describe('ShortcutsDialog', () => {
  it('lists every shortcut with its key combo', () => {
    const html = renderToStaticMarkup(<ShortcutsDialog onClose={() => {}} />);
    for (const { label, description } of Object.values(SHORTCUTS)) {
      expect(html).toContain(`>${description}</span>`);
      expect(html).toContain(`>${label}</kbd>`);
    }
  });
});
