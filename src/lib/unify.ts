/**
 * Tree alignment for side-by-side diff.
 *
 * `unifyTrees` walks two JSON-shaped values in parallel and produces a pair of
 * "aligned" trees. Both output trees have the same shape: every path that
 * exists in either input exists in both outputs. Where a key or array index is
 * present in only one side, the other side gets the `MISSING` sentinel at that
 * position — so the renderer can emit a placeholder row and the two panes
 * stay visually in sync.
 *
 * This is orthogonal to the diff computation in `./diff.ts`: diff produces
 * highlight classes; unify produces matching row structure. Use both together.
 */

export const MISSING: unique symbol = Symbol.for('jsonroom.missing');
export type Missing = typeof MISSING;

export function isMissing(v: unknown): v is Missing {
  return v === MISSING;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export interface UnifiedPair {
  left: unknown;
  right: unknown;
}

/**
 * Aligns `left` and `right` so that they have the same tree shape.
 *
 * - Matching primitives pass through unchanged.
 * - Two objects merge on the union of their keys; left's key order is
 *   preserved, right-only keys are appended in right's order.
 * - Two arrays align by index up to the longer length.
 * - Type mismatches (e.g. `object` vs `string`) pass through as-is — the diff
 *   layer already emits a single "changed" entry at that path.
 */
export function unifyTrees(left: unknown, right: unknown): UnifiedPair {
  // Type mismatch — nothing to align inside. Return as-is so each side
  // renders its own value; the diff will flag the root as "changed".
  const leftIsObj = isPlainObject(left);
  const rightIsObj = isPlainObject(right);
  const leftIsArr = Array.isArray(left);
  const rightIsArr = Array.isArray(right);

  if (leftIsObj && rightIsObj) {
    const l = left as Record<string, unknown>;
    const r = right as Record<string, unknown>;
    const leftKeys = Object.keys(l);
    const rightOnly: string[] = [];
    for (const k of Object.keys(r)) {
      if (!(k in l)) rightOnly.push(k);
    }
    const leftOut: Record<string, unknown> = {};
    const rightOut: Record<string, unknown> = {};
    for (const k of leftKeys) {
      if (k in r) {
        const sub = unifyTrees(l[k], r[k]);
        leftOut[k] = sub.left;
        rightOut[k] = sub.right;
      } else {
        leftOut[k] = l[k];
        rightOut[k] = MISSING;
      }
    }
    for (const k of rightOnly) {
      leftOut[k] = MISSING;
      rightOut[k] = r[k];
    }
    return { left: leftOut, right: rightOut };
  }

  if (leftIsArr && rightIsArr) {
    const l = left as unknown[];
    const r = right as unknown[];
    const max = Math.max(l.length, r.length);
    const leftOut: unknown[] = [];
    const rightOut: unknown[] = [];
    for (let i = 0; i < max; i++) {
      if (i < l.length && i < r.length) {
        const sub = unifyTrees(l[i], r[i]);
        leftOut.push(sub.left);
        rightOut.push(sub.right);
      } else if (i < l.length) {
        leftOut.push(l[i]);
        rightOut.push(MISSING);
      } else {
        leftOut.push(MISSING);
        rightOut.push(r[i]);
      }
    }
    return { left: leftOut, right: rightOut };
  }

  // Primitives or type mismatch — return as-is.
  return { left, right };
}
