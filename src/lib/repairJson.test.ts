import { describe, it, expect } from 'vitest';
import { repairJson } from './repairJson';

describe('repairJson', () => {
  it('returns valid JSON unchanged', () => {
    const input = '{"a": 1, "b": "hello"}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes).toEqual([]);
      expect(result.value).toEqual({ a: 1, b: 'hello' });
    }
  });

  it('removes trailing commas', () => {
    const input = '{"a": 1, "b": 2,}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: 1, b: 2 });
      expect(result.fixes.some((f) => /trailing comma/i.test(f))).toBe(true);
    }
  });

  it('removes trailing commas in arrays', () => {
    const input = '[1, 2, 3,]';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
    }
  });

  it('replaces single quotes with double quotes', () => {
    const input = "{'name': 'John', 'age': 30}";
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: 'John', age: 30 });
      expect(result.fixes.some((f) => /single quote/i.test(f))).toBe(true);
    }
  });

  it('handles single quotes with embedded double quotes', () => {
    const input = "{'msg': 'He said \"hi\"'}";
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ msg: 'He said "hi"' });
    }
  });

  it('quotes unquoted keys', () => {
    const input = '{name: "John", age: 30}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: 'John', age: 30 });
      expect(result.fixes.some((f) => /unquoted key/i.test(f))).toBe(true);
    }
  });

  it('strips line comments', () => {
    const input = `{
      "a": 1, // this is a comment
      "b": 2
    }`;
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: 1, b: 2 });
      expect(result.fixes.some((f) => /comment/i.test(f))).toBe(true);
    }
  });

  it('strips block comments', () => {
    const input = `{
      /* comment */
      "a": 1,
      "b": 2
    }`;
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: 1, b: 2 });
    }
  });

  it('replaces undefined with null', () => {
    const input = '{"a": undefined}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: null });
      expect(result.fixes.some((f) => /JS literal/i.test(f))).toBe(true);
    }
  });

  it('replaces NaN with null', () => {
    const input = '{"a": NaN}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: null });
    }
  });

  it('replaces Infinity with null', () => {
    const input = '{"a": Infinity}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: null });
    }
  });

  it('inserts missing commas between entries', () => {
    const input = `{
  "a": 1
  "b": 2
}`;
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: 1, b: 2 });
      expect(result.fixes.some((f) => /missing comma/i.test(f))).toBe(true);
    }
  });

  it('fixes missing closing brace', () => {
    const input = '{"a": 1, "b": 2';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: 1, b: 2 });
      expect(result.fixes.some((f) => /bracket/i.test(f))).toBe(true);
    }
  });

  it('fixes missing closing bracket', () => {
    const input = '[1, 2, 3';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
    }
  });

  it('fixes extra closing brace', () => {
    const input = '{"a": 1}}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: 1 });
    }
  });

  it('handles multiple issues at once', () => {
    const input = "{name: 'John', age: 30, // comment\n}";
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: 'John', age: 30 });
      expect(result.fixes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('quotes unquoted string values', () => {
    const input = '{"status": ok}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ status: 'ok' });
    }
  });

  it('does not quote true/false/null values', () => {
    const input = '{"a": true, "b": false, "c": null}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: true, b: false, c: null });
      expect(result.fixes).toEqual([]);
    }
  });

  it('returns failure for truly unparseable garbage', () => {
    const input = 'this is not json at all @@@ !!!';
    const result = repairJson(input);
    expect(result.ok).toBe(false);
  });

  it('returns failure for empty input', () => {
    const result = repairJson('');
    expect(result.ok).toBe(false);
  });

  it('handles nested broken JSON', () => {
    const input = `{
      name: 'test',
      data: {
        items: [1, 2, 3,],
        status: ok,
      },
    }`;
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        name: 'test',
        data: { items: [1, 2, 3], status: 'ok' },
      });
    }
  });
});
