/**
 * Apply structural edits to a parsed JSON value at a given path.
 *
 * Path syntax matches `JsonView`'s `childPath` helper:
 *   - object keys joined by `.`           → `foo.bar`
 *   - array indices in brackets           → `items[0].name`
 *   - the empty string is the root        → `""`
 *
 * All operations return a new value (immutable) so React state updates work.
 */

type PathSegment = { kind: 'key'; name: string } | { kind: 'index'; index: number };

/** Parse a path string into structured segments. */
export function parsePath(path: string): PathSegment[] {
  if (path === '') return [];
  const segs: PathSegment[] = [];
  // Tokenize. The regex matches either `.foo`, `foo`, or `[N]`.
  const re = /(?:^|\.)([^.[\]]+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path))) {
    if (m[1] !== undefined) segs.push({ kind: 'key', name: m[1] });
    else if (m[2] !== undefined) segs.push({ kind: 'index', index: Number(m[2]) });
  }
  return segs;
}

/** Shallow-clone a container so we can mutate it without affecting the input. */
function cloneContainer(v: unknown): unknown {
  if (Array.isArray(v)) return v.slice();
  if (v && typeof v === 'object') return { ...(v as Record<string, unknown>) };
  return v;
}

/**
 * Walk to the parent of the addressed node and return both the parent (a fresh
 * clone wired into a fresh root) and the final segment. Used by every mutation
 * so we can swap one entry without touching siblings.
 */
function withClonedAncestors(
  root: unknown,
  segs: PathSegment[],
): { newRoot: unknown; parent: unknown; lastSeg: PathSegment | null } {
  if (segs.length === 0) return { newRoot: root, parent: null, lastSeg: null };

  const newRoot = cloneContainer(root);
  let parent: unknown = newRoot;

  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    const child =
      seg.kind === 'index'
        ? (parent as unknown[])[seg.index]
        : (parent as Record<string, unknown>)[seg.name];
    const clonedChild = cloneContainer(child);
    if (seg.kind === 'index') {
      (parent as unknown[])[seg.index] = clonedChild;
    } else {
      (parent as Record<string, unknown>)[seg.name] = clonedChild;
    }
    parent = clonedChild;
  }

  return { newRoot, parent, lastSeg: segs[segs.length - 1] };
}

/** Replace the value at `path` with `newValue`. */
export function setValueAtPath(root: unknown, path: string, newValue: unknown): unknown {
  const segs = parsePath(path);
  if (segs.length === 0) return newValue;

  const { newRoot, parent, lastSeg } = withClonedAncestors(root, segs);
  if (lastSeg!.kind === 'index') {
    (parent as unknown[])[lastSeg!.index] = newValue;
  } else {
    (parent as Record<string, unknown>)[lastSeg!.name] = newValue;
  }
  return newRoot;
}

/** Delete the entry at `path`. For arrays, splices; for objects, deletes the key. */
export function deleteAtPath(root: unknown, path: string): unknown {
  const segs = parsePath(path);
  if (segs.length === 0) return root; // Refuse to delete root.

  const { newRoot, parent, lastSeg } = withClonedAncestors(root, segs);
  if (lastSeg!.kind === 'index') {
    (parent as unknown[]).splice(lastSeg!.index, 1);
  } else {
    delete (parent as Record<string, unknown>)[lastSeg!.name];
  }
  return newRoot;
}

/**
 * Rename a key on an object, preserving insertion order. Returns the root
 * unchanged if the path doesn't exist or the new name collides with a sibling.
 */
export function renameKeyAtPath(root: unknown, path: string, newKey: string): unknown {
  const segs = parsePath(path);
  if (segs.length === 0) return root;
  const last = segs[segs.length - 1];
  if (last.kind !== 'key') return root; // Only object keys can be renamed.
  if (last.name === newKey) return root;

  const { parent } = withClonedAncestors(root, segs);
  const obj = parent as Record<string, unknown>;
  if (newKey in obj) return root; // Collision — caller should validate first.

  // Rebuild the object so the renamed key keeps its insertion-order slot.
  const rebuilt: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (k === last.name) rebuilt[newKey] = obj[k];
    else rebuilt[k] = obj[k];
  }

  // Replace the parent in the cloned chain. We need to walk the ancestors of
  // `parent` once more to swap it; simplest is to redo the walk targeting the
  // grandparent and assign `rebuilt` to the renamed slot.
  if (segs.length === 1) {
    return rebuilt;
  }
  const grandSegs = segs.slice(0, -1);
  return setValueAtPath(root, segPathToString(grandSegs), rebuilt);
}

/**
 * Add a child to an array or object at `parentPath`. For arrays the new value
 * is pushed; for objects, `keyOrUndef` is the new key (or a generated one).
 */
export function addChildAtPath(
  root: unknown,
  parentPath: string,
  newValue: unknown,
  keyOrUndef?: string,
): unknown {
  const parent = getAtPath(root, parentPath);
  if (Array.isArray(parent)) {
    const next = parent.slice();
    next.push(newValue);
    return setValueAtPath(root, parentPath, next);
  }
  if (parent && typeof parent === 'object') {
    const obj = parent as Record<string, unknown>;
    let key = keyOrUndef ?? 'newKey';
    let i = 1;
    while (key in obj) key = `newKey${i++}`;
    return setValueAtPath(root, parentPath, { ...obj, [key]: newValue });
  }
  return root;
}

/** Read the value at `path` without mutation. */
export function getAtPath(root: unknown, path: string): unknown {
  const segs = parsePath(path);
  let cur: unknown = root;
  for (const seg of segs) {
    if (cur == null) return undefined;
    cur = seg.kind === 'index' ? (cur as unknown[])[seg.index] : (cur as Record<string, unknown>)[seg.name];
  }
  return cur;
}

/** Re-serialize structured segments back to a path string. */
function segPathToString(segs: PathSegment[]): string {
  let out = '';
  for (const seg of segs) {
    if (seg.kind === 'index') out += `[${seg.index}]`;
    else out += out === '' ? seg.name : `.${seg.name}`;
  }
  return out;
}

/**
 * Coerce a string typed by the user into a JSON-typed value.
 *  - "true" / "false" → boolean
 *  - "null"           → null
 *  - looks-like-number → number
 *  - otherwise        → string (unwrapped if surrounding quotes are present)
 */
export function coerceInputToJson(input: string): unknown {
  const trimmed = input.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed !== '' && !isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  // Strip a single layer of surrounding double-quotes if present.
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return input; // Keep raw user input as a string (preserves trailing/leading spaces).
}
