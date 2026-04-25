import { describe, expect, it } from 'vitest';
import {
  parsePath,
  setValueAtPath,
  deleteAtPath,
  renameKeyAtPath,
  addChildAtPath,
  getAtPath,
  coerceInputToJson,
} from './editPath';

describe('parsePath', () => {
  it('returns empty array for the root', () => {
    expect(parsePath('')).toEqual([]);
  });

  it('parses a single object key', () => {
    expect(parsePath('foo')).toEqual([{ kind: 'key', name: 'foo' }]);
  });

  it('parses dotted object keys', () => {
    expect(parsePath('foo.bar.baz')).toEqual([
      { kind: 'key', name: 'foo' },
      { kind: 'key', name: 'bar' },
      { kind: 'key', name: 'baz' },
    ]);
  });

  it('parses array indices', () => {
    expect(parsePath('items[0]')).toEqual([
      { kind: 'key', name: 'items' },
      { kind: 'index', index: 0 },
    ]);
  });

  it('parses mixed key + index segments', () => {
    expect(parsePath('a.b[2].c[10]')).toEqual([
      { kind: 'key', name: 'a' },
      { kind: 'key', name: 'b' },
      { kind: 'index', index: 2 },
      { kind: 'key', name: 'c' },
      { kind: 'index', index: 10 },
    ]);
  });

  it('parses leading array index (root array)', () => {
    expect(parsePath('[0]')).toEqual([{ kind: 'index', index: 0 }]);
    expect(parsePath('[0].name')).toEqual([
      { kind: 'index', index: 0 },
      { kind: 'key', name: 'name' },
    ]);
  });
});

describe('getAtPath', () => {
  const tree = {
    user: { name: 'Ada', age: 30 },
    items: [10, 20, { tag: 'x' }],
  };

  it('returns the root for empty path', () => {
    expect(getAtPath(tree, '')).toBe(tree);
  });

  it('reads a top-level key', () => {
    expect(getAtPath(tree, 'user')).toEqual({ name: 'Ada', age: 30 });
  });

  it('reads a nested key', () => {
    expect(getAtPath(tree, 'user.name')).toBe('Ada');
  });

  it('reads an array element', () => {
    expect(getAtPath(tree, 'items[1]')).toBe(20);
  });

  it('reads through arrays into objects', () => {
    expect(getAtPath(tree, 'items[2].tag')).toBe('x');
  });

  it('returns undefined when path does not exist', () => {
    expect(getAtPath(tree, 'user.missing')).toBeUndefined();
  });
});

describe('setValueAtPath', () => {
  it('replaces the root when path is empty', () => {
    expect(setValueAtPath({ a: 1 }, '', 'replaced')).toBe('replaced');
  });

  it('updates a top-level value', () => {
    const out = setValueAtPath({ a: 1, b: 2 }, 'a', 99);
    expect(out).toEqual({ a: 99, b: 2 });
  });

  it('updates a nested value', () => {
    const out = setValueAtPath({ user: { name: 'Ada', age: 30 } }, 'user.age', 31);
    expect(out).toEqual({ user: { name: 'Ada', age: 31 } });
  });

  it('updates an array element', () => {
    const out = setValueAtPath({ items: [1, 2, 3] }, 'items[1]', 200);
    expect(out).toEqual({ items: [1, 200, 3] });
  });

  it('returns a new root (immutability)', () => {
    const root = { a: 1 };
    const out = setValueAtPath(root, 'a', 2);
    expect(out).not.toBe(root);
    expect(root).toEqual({ a: 1 }); // original unchanged
  });

  it('does not mutate sibling subtrees (structural sharing)', () => {
    const root = { x: { deep: 'a' }, y: { deep: 'b' } };
    const out = setValueAtPath(root, 'x.deep', 'A') as { x: unknown; y: unknown };
    // sibling `y` reference is reused
    expect(out.y).toBe(root.y);
    // touched ancestor `x` is a fresh object
    expect(out.x).not.toBe(root.x);
  });

  it('preserves object key order on update', () => {
    const out = setValueAtPath({ a: 1, b: 2, c: 3 }, 'b', 99);
    expect(Object.keys(out as Record<string, unknown>)).toEqual(['a', 'b', 'c']);
  });
});

describe('deleteAtPath', () => {
  it('refuses to delete the root', () => {
    const root = { a: 1 };
    expect(deleteAtPath(root, '')).toBe(root);
  });

  it('removes an object key', () => {
    expect(deleteAtPath({ a: 1, b: 2, c: 3 }, 'b')).toEqual({ a: 1, c: 3 });
  });

  it('splices an array element', () => {
    expect(deleteAtPath({ items: [10, 20, 30] }, 'items[1]')).toEqual({
      items: [10, 30],
    });
  });

  it('removes a deeply nested key', () => {
    const out = deleteAtPath({ user: { name: 'Ada', age: 30 } }, 'user.age');
    expect(out).toEqual({ user: { name: 'Ada' } });
  });

  it('does not mutate the input', () => {
    const root = { a: 1, b: 2 };
    deleteAtPath(root, 'a');
    expect(root).toEqual({ a: 1, b: 2 });
  });
});

describe('renameKeyAtPath', () => {
  it('renames a top-level key', () => {
    const out = renameKeyAtPath({ status: 'ok', env: 'prod' }, 'status', 'state');
    expect(out).toEqual({ state: 'ok', env: 'prod' });
  });

  it('preserves insertion order when renaming', () => {
    const out = renameKeyAtPath({ a: 1, b: 2, c: 3 }, 'b', 'B');
    expect(Object.keys(out as Record<string, unknown>)).toEqual(['a', 'B', 'c']);
  });

  it('renames a nested key', () => {
    const out = renameKeyAtPath({ user: { name: 'Ada', age: 30 } }, 'user.age', 'years');
    expect(out).toEqual({ user: { name: 'Ada', years: 30 } });
  });

  it('returns root unchanged on collision with sibling', () => {
    const root = { a: 1, b: 2 };
    expect(renameKeyAtPath(root, 'a', 'b')).toBe(root);
  });

  it('returns root unchanged when name is identical', () => {
    const root = { a: 1 };
    expect(renameKeyAtPath(root, 'a', 'a')).toBe(root);
  });

  it('refuses to rename array indices', () => {
    const root = { items: [1, 2, 3] };
    // Path ends in an index → not an object key, so rename is a no-op.
    expect(renameKeyAtPath(root, 'items[0]', 'first')).toBe(root);
  });

  it('refuses to rename the root', () => {
    const root = { a: 1 };
    expect(renameKeyAtPath(root, '', 'newRoot')).toBe(root);
  });
});

describe('addChildAtPath', () => {
  it('appends to an array', () => {
    expect(addChildAtPath({ items: [1, 2] }, 'items', 3)).toEqual({
      items: [1, 2, 3],
    });
  });

  it('adds a new key to an object using default name', () => {
    const out = addChildAtPath({ a: 1 }, '', 'val') as Record<string, unknown>;
    expect(out.a).toBe(1);
    expect(out.newKey).toBe('val');
  });

  it('generates non-colliding key names (newKey, newKey1, ...)', () => {
    const out = addChildAtPath({ newKey: 'a', newKey1: 'b' }, '', 'c') as Record<string, unknown>;
    expect(out.newKey2).toBe('c');
    // existing values untouched
    expect(out.newKey).toBe('a');
    expect(out.newKey1).toBe('b');
  });

  it('uses a caller-provided key when given', () => {
    const out = addChildAtPath({ a: 1 }, '', 42, 'b') as Record<string, unknown>;
    expect(out).toEqual({ a: 1, b: 42 });
  });

  it('falls back to numeric suffix when caller-provided key collides', () => {
    const out = addChildAtPath({ foo: 1 }, '', 2, 'foo') as Record<string, unknown>;
    // `foo` already exists, so the helper switches to its own collision-avoiding scheme.
    expect(out.foo).toBe(1);
    expect(Object.keys(out).length).toBe(2);
  });

  it('adds to a nested array', () => {
    const out = addChildAtPath({ data: { items: [1] } }, 'data.items', 2);
    expect(out).toEqual({ data: { items: [1, 2] } });
  });

  it('returns root unchanged when parent is a primitive', () => {
    const root = { a: 1, b: 'string' };
    expect(addChildAtPath(root, 'a', 99)).toBe(root);
  });
});

describe('coerceInputToJson', () => {
  it('coerces "true" / "false" to booleans', () => {
    expect(coerceInputToJson('true')).toBe(true);
    expect(coerceInputToJson('false')).toBe(false);
  });

  it('coerces "null" to null', () => {
    expect(coerceInputToJson('null')).toBeNull();
  });

  it('coerces integer-looking strings to numbers', () => {
    expect(coerceInputToJson('42')).toBe(42);
    expect(coerceInputToJson('-7')).toBe(-7);
    expect(coerceInputToJson('0')).toBe(0);
  });

  it('coerces decimal and exponential numbers', () => {
    expect(coerceInputToJson('3.14')).toBe(3.14);
    expect(coerceInputToJson('1e3')).toBe(1000);
    expect(coerceInputToJson('-2.5E-2')).toBe(-0.025);
  });

  it('does not coerce numbers with stray characters', () => {
    expect(coerceInputToJson('42px')).toBe('42px');
    expect(coerceInputToJson('1.2.3')).toBe('1.2.3');
  });

  it('strips surrounding double-quotes when present', () => {
    expect(coerceInputToJson('"hello"')).toBe('hello');
    expect(coerceInputToJson('"42"')).toBe('42'); // stays a string
  });

  it('keeps non-quoted strings as-is, preserving whitespace', () => {
    expect(coerceInputToJson('hello world')).toBe('hello world');
    expect(coerceInputToJson('  spaces  ')).toBe('  spaces  ');
  });

  it('returns empty string for empty input', () => {
    expect(coerceInputToJson('')).toBe('');
  });
});
