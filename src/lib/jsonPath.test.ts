import { describe, it, expect } from 'vitest';
import { ROOT_PATH, childPath, parsePath, getAncestors } from './jsonPath';
import { getAtPath, setValueAtPath, deleteAtPath, renameKeyAtPath } from './editPath';
import { diffJson } from './diff';
import { collectMatches } from '../hooks/useSearch';

describe('childPath / parsePath', () => {
  it('uses the empty string for the root', () => {
    expect(ROOT_PATH).toBe('');
    expect(parsePath(ROOT_PATH)).toEqual([]);
  });

  it('round-trips keys that contain path syntax', () => {
    for (const key of ['user.name', 'items[0]', 'a/b', 'til~de', '~1', '', ' ', '[', ']', '.']) {
      const path = childPath(ROOT_PATH, key);
      expect(parsePath(path)).toEqual([key]);
    }
  });

  it('nests keys and indices', () => {
    const path = childPath(childPath(childPath(ROOT_PATH, 'items'), 2), 'tag');
    expect(parsePath(path)).toEqual(['items', '2', 'tag']);
  });
});

describe('literal keys never collide with nested paths', () => {
  const cases: [string, unknown, string, string | number][] = [
    ['a dotted key and a nested object', { 'user.name': 1, user: { name: 2 } }, 'user', 'name'],
    ['a bracketed key and an array', { 'items[0]': 1, items: [2] }, 'items', 0],
    ['a slash key and a nested object', { 'a/b': 1, a: { b: 2 } }, 'a', 'b'],
  ];

  for (const [label, doc, parent, child] of cases) {
    it(`gives distinct paths to ${label}`, () => {
      const literal = childPath(ROOT_PATH, Object.keys(doc as object)[0]);
      const nested = childPath(childPath(ROOT_PATH, parent), child);
      expect(literal).not.toBe(nested);
      expect(getAtPath(doc, literal)).toBe(1);
      expect(getAtPath(doc, nested)).toBe(2);
    });
  }

  it('gives an empty-string key a path distinct from the root', () => {
    const doc = { '': 1 };
    expect(childPath(ROOT_PATH, '')).not.toBe(ROOT_PATH);
    expect(getAtPath(doc, childPath(ROOT_PATH, ''))).toBe(1);
  });
});

describe('edits address the literal key', () => {
  const doc = { 'user.name': 'literal', user: { name: 'nested' } };
  const literal = childPath(ROOT_PATH, 'user.name');

  it('sets only the literal key', () => {
    expect(setValueAtPath(doc, literal, 'x')).toEqual({ 'user.name': 'x', user: { name: 'nested' } });
  });

  it('deletes only the literal key', () => {
    expect(deleteAtPath(doc, literal)).toEqual({ user: { name: 'nested' } });
  });

  it('renames only the literal key', () => {
    expect(renameKeyAtPath(doc, literal, 'renamed')).toEqual({ renamed: 'literal', user: { name: 'nested' } });
  });

  it('treats a numeric-looking key on an object as a key', () => {
    const obj = { '0': 'zero', '1': 'one' };
    expect(deleteAtPath(obj, childPath(ROOT_PATH, '0'))).toEqual({ '1': 'one' });
  });
});

describe('every module produces the same path for the same node', () => {
  const left = { 'user.name': 'Ada', user: { name: 'Ada' }, items: [{ 'a.b': 1 }] };
  const right = { 'user.name': 'Grace', user: { name: 'Ada' }, items: [{ 'a.b': 2 }] };
  const literal = childPath(ROOT_PATH, 'user.name');
  const deep = childPath(childPath(childPath(ROOT_PATH, 'items'), 0), 'a.b');

  it('diff reports the literal key, not the nested one', () => {
    expect(diffJson(left, right).map((e) => e.path).sort()).toEqual([deep, literal].sort());
  });

  it('search reports the same path as the diff and the editor', () => {
    const hit = collectMatches(left, 'Ada', false).map((m) => m.path);
    expect(hit).toContain(literal);
    expect(hit).toContain(childPath(childPath(ROOT_PATH, 'user'), 'name'));
    for (const p of hit) expect(getAtPath(left, p)).toBe('Ada');
  });

  it('ancestors of a node under a dotted key are its real parents', () => {
    expect(getAncestors(deep)).toEqual([childPath(childPath(ROOT_PATH, 'items'), 0), childPath(ROOT_PATH, 'items')]);
  });

  it('reports a root type mismatch at the root path', () => {
    expect(diffJson({ a: 1 }, [1])).toEqual([{ path: ROOT_PATH, kind: 'changed', left: { a: 1 }, right: [1] }]);
  });
});
