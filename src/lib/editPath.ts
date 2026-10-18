/**
 * Apply structural edits to a parsed JSON value at a given path.
 *
 * Paths are the shared JSON Pointer format from `jsonPath.ts`: the root is
 * `""` and `/items/0/name` is `items[0].name`. Whether a step is an array
 * index or an object key is decided by the container it lands in.
 *
 * All operations return a new value (immutable) so React state updates work.
 * A path that does not exist leaves the value unchanged.
 */

import { joinPath, parsePath, stepInto } from './jsonPath';

/** Shallow-clone a container so we can mutate it without affecting the input. */
function cloneContainer(v: unknown): unknown {
  if (Array.isArray(v)) return v.slice();
  if (v && typeof v === 'object') return { ...(v as Record<string, unknown>) };
  return v;
}

function isContainer(v: unknown): v is unknown[] | Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

/** A valid index into `arr` for an existing element, or -1. */
function indexIn(arr: unknown[], step: string): number {
  if (!/^(0|[1-9]\d*)$/.test(step)) return -1;
  const index = Number(step);
  return index < arr.length ? index : -1;
}

/**
 * Walk to the parent of the addressed node and return both the parent (a fresh
 * clone wired into a fresh root) and the final step. Used by every mutation
 * so we can swap one entry without touching siblings. Returns null when the
 * path does not lead to an existing node.
 */
function withClonedAncestors(
  root: unknown,
  steps: string[],
): { newRoot: unknown; parent: unknown[] | Record<string, unknown>; lastStep: string } | null {
  const newRoot = cloneContainer(root);
  let parent: unknown = newRoot;

  for (let i = 0; i < steps.length - 1; i++) {
    const next = stepInto(parent, steps[i]);
    if (!next.found || !isContainer(next.value)) return null;
    const clonedChild = cloneContainer(next.value);
    if (Array.isArray(parent)) parent[Number(steps[i])] = clonedChild;
    else (parent as Record<string, unknown>)[steps[i]] = clonedChild;
    parent = clonedChild;
  }

  const lastStep = steps[steps.length - 1];
  if (!stepInto(parent, lastStep).found) return null;
  return { newRoot, parent: parent as unknown[] | Record<string, unknown>, lastStep };
}

/** Replace the value at `path` with `newValue`. */
export function setValueAtPath(root: unknown, path: string, newValue: unknown): unknown {
  const steps = parsePath(path);
  if (steps.length === 0) return newValue;

  const walk = withClonedAncestors(root, steps);
  if (!walk) return root;
  const { newRoot, parent, lastStep } = walk;
  if (Array.isArray(parent)) parent[indexIn(parent, lastStep)] = newValue;
  else parent[lastStep] = newValue;
  return newRoot;
}

/** Delete the entry at `path`. For arrays, splices; for objects, deletes the key. */
export function deleteAtPath(root: unknown, path: string): unknown {
  const steps = parsePath(path);
  if (steps.length === 0) return root; // Refuse to delete root.

  const walk = withClonedAncestors(root, steps);
  if (!walk) return root;
  const { newRoot, parent, lastStep } = walk;
  if (Array.isArray(parent)) parent.splice(indexIn(parent, lastStep), 1);
  else delete parent[lastStep];
  return newRoot;
}

/**
 * Rename a key on an object, preserving insertion order. Returns the root
 * unchanged if the path doesn't exist, addresses an array element, or the new
 * name collides with a sibling.
 */
export function renameKeyAtPath(root: unknown, path: string, newKey: string): unknown {
  const steps = parsePath(path);
  if (steps.length === 0) return root;
  const oldKey = steps[steps.length - 1];
  if (oldKey === newKey) return root;

  const parentSteps = steps.slice(0, -1);
  const obj = getAtPath(root, joinPath(parentSteps));
  // Only object keys can be renamed.
  if (!isContainer(obj) || Array.isArray(obj) || !Object.prototype.hasOwnProperty.call(obj, oldKey)) return root;
  if (Object.prototype.hasOwnProperty.call(obj, newKey)) return root; // Collision — caller should validate first.

  // Rebuild the object so the renamed key keeps its insertion-order slot.
  const rebuilt: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (k === oldKey) rebuilt[newKey] = obj[k];
    else rebuilt[k] = obj[k];
  }
  return setValueAtPath(root, joinPath(parentSteps), rebuilt);
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
  let cur: unknown = root;
  for (const step of parsePath(path)) {
    const next = stepInto(cur, step);
    if (!next.found) return undefined;
    cur = next.value;
  }
  return cur;
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
