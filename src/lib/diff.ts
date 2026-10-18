/**
 * Minimal JSON diff — returns a flat list of paths with change types.
 * Good enough for v1; swap for a smarter algorithm later if needed.
 *
 * Paths use the shared format from `jsonPath.ts`, so they match the rows the
 * viewer renders. A difference at the root is reported at the root path.
 */

import { ROOT_PATH, childPath } from './jsonPath';

export type DiffKind = 'added' | 'removed' | 'changed';

export interface DiffEntry {
  path: string;
  kind: DiffKind;
  left?: unknown;
  right?: unknown;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function diffJson(left: unknown, right: unknown, base = ROOT_PATH): DiffEntry[] {
  const out: DiffEntry[] = [];

  // Primitive or type-mismatched comparison.
  if (
    typeof left !== typeof right ||
    (Array.isArray(left) !== Array.isArray(right)) ||
    (isObject(left) !== isObject(right))
  ) {
    out.push({ path: base, kind: 'changed', left, right });
    return out;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length);
    for (let i = 0; i < max; i++) {
      if (i >= left.length) {
        out.push({ path: childPath(base, i), kind: 'added', right: right[i] });
      } else if (i >= right.length) {
        out.push({ path: childPath(base, i), kind: 'removed', left: left[i] });
      } else {
        out.push(...diffJson(left[i], right[i], childPath(base, i)));
      }
    }
    return out;
  }

  if (isObject(left) && isObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of keys) {
      if (!(key in left)) {
        out.push({ path: childPath(base, key), kind: 'added', right: right[key] });
      } else if (!(key in right)) {
        out.push({ path: childPath(base, key), kind: 'removed', left: left[key] });
      } else {
        out.push(...diffJson(left[key], right[key], childPath(base, key)));
      }
    }
    return out;
  }

  // Primitives.
  if (left !== right) {
    out.push({ path: base, kind: 'changed', left, right });
  }
  return out;
}
