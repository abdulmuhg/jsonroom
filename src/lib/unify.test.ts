import { describe, expect, it } from 'vitest';
import { MISSING, isMissing, unifyTrees } from './unify';

describe('unifyTrees', () => {
  it('passes matching primitives through unchanged', () => {
    expect(unifyTrees(1, 1)).toEqual({ left: 1, right: 1 });
    expect(unifyTrees('a', 'b')).toEqual({ left: 'a', right: 'b' });
    expect(unifyTrees(null, null)).toEqual({ left: null, right: null });
  });

  it('merges objects on the union of keys, MISSING-filling the gaps', () => {
    const { left, right } = unifyTrees({ a: 1, b: 2 }, { b: 20, c: 30 });
    expect(left).toEqual({ a: 1, b: 2, c: MISSING });
    expect(right).toEqual({ a: MISSING, b: 20, c: 30 });
  });

  it('preserves left key order, appends right-only keys in right order', () => {
    const { left, right } = unifyTrees({ a: 1, b: 2 }, { c: 3, b: 4, d: 5 });
    expect(Object.keys(left)).toEqual(['a', 'b', 'c', 'd']);
    expect(Object.keys(right)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('aligns arrays by index up to the longer length', () => {
    const { left, right } = unifyTrees([1, 2, 3], [1, 20]);
    expect(left).toEqual([1, 2, 3]);
    expect(right).toEqual([1, 20, MISSING]);
  });

  it('recurses into nested structures', () => {
    const { left, right } = unifyTrees(
      { user: { name: 'Ada', age: 30 } },
      { user: { name: 'Ada', email: 'a@b.c' } },
    );
    expect(left).toEqual({ user: { name: 'Ada', age: 30, email: MISSING } });
    expect(right).toEqual({ user: { name: 'Ada', age: MISSING, email: 'a@b.c' } });
  });

  it('passes through type mismatches without alignment', () => {
    const { left, right } = unifyTrees({ x: 1 }, 'string');
    expect(left).toEqual({ x: 1 });
    expect(right).toEqual('string');
  });

  it('isMissing identifies the MISSING sentinel', () => {
    expect(isMissing(MISSING)).toBe(true);
    expect(isMissing(null)).toBe(false);
    expect(isMissing(undefined)).toBe(false);
    expect(isMissing(0)).toBe(false);
    expect(isMissing('MISSING')).toBe(false);
  });
});
