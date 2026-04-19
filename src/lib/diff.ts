/**
 * Minimal JSON diff — returns a flat list of paths with change types.
 * Good enough for v1; swap for a smarter algorithm later if needed.
 */

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

function joinPath(base: string, key: string | number): string {
  if (base === '') return typeof key === 'number' ? `[${key}]` : key;
  return typeof key === 'number' ? `${base}[${key}]` : `${base}.${key}`;
}

export function diffJson(left: unknown, right: unknown, base = ''): DiffEntry[] {
  const out: DiffEntry[] = [];

  // Primitive or type-mismatched comparison.
  if (
    typeof left !== typeof right ||
    (Array.isArray(left) !== Array.isArray(right)) ||
    (isObject(left) !== isObject(right))
  ) {
    out.push({ path: base || '(root)', kind: 'changed', left, right });
    return out;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length);
    for (let i = 0; i < max; i++) {
      if (i >= left.length) {
        out.push({ path: joinPath(base, i), kind: 'added', right: right[i] });
      } else if (i >= right.length) {
        out.push({ path: joinPath(base, i), kind: 'removed', left: left[i] });
      } else {
        out.push(...diffJson(left[i], right[i], joinPath(base, i)));
      }
    }
    return out;
  }

  if (isObject(left) && isObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    for (const key of keys) {
      if (!(key in left)) {
        out.push({ path: joinPath(base, key), kind: 'added', right: right[key] });
      } else if (!(key in right)) {
        out.push({ path: joinPath(base, key), kind: 'removed', left: left[key] });
      } else {
        out.push(...diffJson(left[key], right[key], joinPath(base, key)));
      }
    }
    return out;
  }

  // Primitives.
  if (left !== right) {
    out.push({ path: base || '(root)', kind: 'changed', left, right });
  }
  return out;
}
