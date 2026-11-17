import { childPath, ROOT_PATH } from './jsonPath';

export type FoldMode = 'expand' | 'collapse';

/**
 * Open/closed overrides for every object and array in `value`.
 *
 * `expand` opens them all. `collapse` closes them all except the root, so the
 * view shows the top-level keys instead of a single `{…}`.
 */
export function buildFoldOverrides(value: unknown, mode: FoldMode): Map<string, boolean> {
  const map = new Map<string, boolean>();

  const walk = (v: unknown, path: string): void => {
    if (v === null || typeof v !== 'object') return;
    map.set(path, mode === 'expand' || path === ROOT_PATH);
    const entries: Array<[string | number, unknown]> = Array.isArray(v)
      ? v.map((x, i) => [i, x])
      : Object.entries(v as Record<string, unknown>);
    for (const [k, cv] of entries) walk(cv, childPath(path, k));
  };

  walk(value, ROOT_PATH);
  return map;
}
