import { describe, it, expect } from 'vitest';
import { collectMatches, getAncestors } from './useSearch';

describe('collectMatches', () => {
  it('finds matching string values', () => {
    const result = collectMatches({ name: 'Alice', age: 30 }, 'ali', false);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('name');
    expect(result[0].matchesKey).toBe(false);
    expect(result[0].matchesValue).toBe(true);
  });

  it('finds matching keys', () => {
    const result = collectMatches({ username: 'bob' }, 'user', false);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('username');
    expect(result[0].matchesKey).toBe(true);
  });

  it('finds nested string values', () => {
    const result = collectMatches({ user: { email: 'test@example.com' } }, 'test', false);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('user.email');
  });

  it('finds values in arrays', () => {
    const result = collectMatches({ items: ['apple', 'banana'] }, 'banana', false);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('items[1]');
  });

  it('is case-insensitive by default', () => {
    const result = collectMatches({ name: 'Alice' }, 'alice', false);
    expect(result).toHaveLength(1);
  });

  it('respects case sensitivity when enabled', () => {
    expect(collectMatches({ name: 'Alice' }, 'alice', true)).toHaveLength(0);
    expect(collectMatches({ name: 'Alice' }, 'Alice', true)).toHaveLength(1);
  });

  it('matches boolean values', () => {
    const result = collectMatches({ active: true }, 'true', false);
    expect(result).toHaveLength(1);
    expect(result[0].matchesValue).toBe(true);
  });

  it('matches null values', () => {
    const result = collectMatches({ deleted: null }, 'null', false);
    expect(result).toHaveLength(1);
    expect(result[0].matchesValue).toBe(true);
  });

  it('matches numeric values', () => {
    const result = collectMatches({ port: 8080 }, '808', false);
    expect(result).toHaveLength(1);
    expect(result[0].matchesValue).toBe(true);
  });

  it('returns empty array for empty query', () => {
    expect(collectMatches({ a: 1 }, '', false)).toHaveLength(0);
  });

  it('returns empty array when nothing matches', () => {
    expect(collectMatches({ a: 'hello' }, 'xyz', false)).toHaveLength(0);
  });

  it('records both matchesKey and matchesValue when both match', () => {
    const result = collectMatches({ name: 'name is a common key' }, 'name', false);
    const nameMatch = result.find(m => m.path === 'name');
    expect(nameMatch?.matchesKey).toBe(true);
    expect(nameMatch?.matchesValue).toBe(true);
  });

  it('matches container key AND continues traversing into its children', () => {
    // When a container's key matches, we record the container path AND keep
    // traversing — so nested matches are still findable. This means a query
    // that hits both a container key and a descendant value yields two matches.
    const result = collectMatches({ user: { name: 'user' } }, 'user', false);
    expect(result).toHaveLength(2);
    const paths = result.map((m) => m.path).sort();
    expect(paths).toEqual(['user', 'user.name']);
    const containerMatch = result.find((m) => m.path === 'user');
    expect(containerMatch?.matchesKey).toBe(true);
    expect(containerMatch?.matchesValue).toBe(false);
    const leafMatch = result.find((m) => m.path === 'user.name');
    expect(leafMatch?.matchesValue).toBe(true);
  });
});

describe('getAncestors', () => {
  it('returns empty array for top-level paths', () => {
    expect(getAncestors('name')).toEqual([]);
  });

  it('returns parent for dot-notation paths', () => {
    expect(getAncestors('user.email')).toEqual(['user']);
  });

  it('returns all ancestors for deeply nested paths', () => {
    expect(getAncestors('user.address.city')).toEqual(['user.address', 'user']);
  });

  it('returns parent for array index paths', () => {
    expect(getAncestors('items[0]')).toEqual(['items']);
  });

  it('returns all ancestors for mixed dot-and-array paths', () => {
    expect(getAncestors('items[0].name')).toEqual(['items[0]', 'items']);
  });

  it('handles deeply nested array paths', () => {
    expect(getAncestors('a.b[2].c')).toEqual(['a.b[2]', 'a.b', 'a']);
  });
});
