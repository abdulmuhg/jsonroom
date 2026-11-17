import { describe, expect, it } from 'vitest';
import { buildFoldOverrides } from './fold';

const sample = {
  a: { b: { c: 1 }, list: [1, { d: [] }] },
  'x/y~z': {},
  n: 5,
};

describe('buildFoldOverrides', () => {
  it('expand opens every container, including empty ones and escaped keys', () => {
    const m = buildFoldOverrides(sample, 'expand');
    expect([...m.keys()].sort()).toEqual(
      ['', '/a', '/a/b', '/a/list', '/a/list/1', '/a/list/1/d', '/x~1y~0z'].sort(),
    );
    expect([...m.values()].every((v) => v === true)).toBe(true);
  });

  it('collapse keeps the root open and closes everything below', () => {
    const m = buildFoldOverrides(sample, 'collapse');
    expect(m.get('')).toBe(true);
    expect(m.get('/a')).toBe(false);
    expect(m.get('/a/b')).toBe(false);
    expect(m.get('/a/list/1/d')).toBe(false);
    expect(m.size).toBe(7);
  });

  it('returns an empty map for primitives and null', () => {
    expect(buildFoldOverrides(5, 'expand').size).toBe(0);
    expect(buildFoldOverrides(null, 'collapse').size).toBe(0);
  });
});
