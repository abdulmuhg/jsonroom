/**
 * The one path format shared by the viewer, search, diff and editor.
 *
 * Paths are JSON Pointers (RFC 6901): the root is `""`, and each step adds
 * `/` plus the key or index, with `~` written `~0` and `/` written `~1`.
 * `{"user.name": 1}` is `/user.name` and `{"user": {"name": 1}}` is
 * `/user/name`, so a literal key can never be mistaken for a nested path.
 *
 * A step does not record whether it is a key or an index: `/0` is index 0 in
 * an array and key "0" in an object. Code that walks a path decides by looking
 * at the container it is in.
 *
 * Paths are compared as strings (Map and Set keys), so every module must build
 * them with `childPath`, never by hand.
 */

export const ROOT_PATH = '';

function escapeStep(step: string): string {
  return step.replace(/~/g, '~0').replace(/\//g, '~1');
}

function unescapeStep(step: string): string {
  return step.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** Path of the child `key` (an object key or array index) under `parent`. */
export function childPath(parent: string, key: string | number): string {
  return `${parent}/${escapeStep(String(key))}`;
}

/** Split a path into its unescaped steps. The root has none. */
export function parsePath(path: string): string[] {
  if (path === ROOT_PATH) return [];
  return path.slice(1).split('/').map(unescapeStep);
}

/** Rebuild a path from steps, the inverse of `parsePath`. */
export function joinPath(steps: readonly (string | number)[]): string {
  return steps.reduce<string>((path, step) => childPath(path, step), ROOT_PATH);
}

/** Every ancestor of `path`, nearest first, not counting the root. */
export function getAncestors(path: string): string[] {
  const steps = parsePath(path);
  const ancestors: string[] = [];
  for (let n = steps.length - 1; n >= 1; n--) ancestors.push(joinPath(steps.slice(0, n)));
  return ancestors;
}

/**
 * Read one step of a walk: the array index if `container` is an array and the
 * step is a valid index, the object key if it is an object, otherwise nothing.
 */
export function stepInto(container: unknown, step: string): { found: true; value: unknown } | { found: false } {
  if (Array.isArray(container)) {
    if (!/^(0|[1-9]\d*)$/.test(step)) return { found: false };
    const index = Number(step);
    return index < container.length ? { found: true, value: container[index] } : { found: false };
  }
  if (container !== null && typeof container === 'object' && Object.prototype.hasOwnProperty.call(container, step)) {
    return { found: true, value: (container as Record<string, unknown>)[step] };
  }
  return { found: false };
}
