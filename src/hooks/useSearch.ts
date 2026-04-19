import { useCallback, useEffect, useMemo, useState } from 'react';

export interface SearchMatch {
  path: string;
  matchesKey: boolean;
  matchesValue: boolean;
}

export interface UseSearchReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  query: string;
  setQuery: (q: string) => void;
  caseSensitive: boolean;
  setCaseSensitive: (v: boolean) => void;
  matches: SearchMatch[];
  activeIndex: number;
  activeMatch: SearchMatch | null;
  matchPaths: Set<string>;
  expandPaths: Set<string>;
  goNext: () => void;
  goPrev: () => void;
}

// Exported for testing.
export function collectMatches(
  value: unknown,
  query: string,
  caseSensitive: boolean,
): SearchMatch[] {
  if (!query) return [];
  const results: SearchMatch[] = [];
  traverseNode(value, '', null, query, caseSensitive, results);
  return results;
}

// Exported for testing.
export function getAncestors(path: string): string[] {
  const ancestors: string[] = [];
  let current = path;
  while (current.length > 0) {
    const arrayMatch = current.match(/^(.*)\[\d+\]$/);
    if (arrayMatch) {
      current = arrayMatch[1];
    } else {
      const dotIdx = current.lastIndexOf('.');
      if (dotIdx === -1) {
        current = '';
      } else {
        current = current.slice(0, dotIdx);
      }
    }
    if (current !== '') ancestors.push(current);
  }
  return ancestors;
}

function traverseNode(
  value: unknown,
  path: string,
  keyName: string | number | null,
  query: string,
  caseSensitive: boolean,
  results: SearchMatch[],
): void {
  const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const q = caseSensitive ? query : query.toLowerCase();
  const matchesKey = keyName !== null && norm(String(keyName)).includes(q);

  const isContainer = value !== null && typeof value === 'object';

  if (!isContainer) {
    const valueStr =
      value === null ? 'null' : typeof value === 'string' ? value : String(value);
    const matchesValue = norm(valueStr).includes(q);
    if (matchesKey || matchesValue) {
      results.push({ path, matchesKey, matchesValue });
    }
    return;
  }

  if (matchesKey) {
    results.push({ path, matchesKey: true, matchesValue: false });
  }

  if (Array.isArray(value)) {
    (value as unknown[]).forEach((item, i) => {
      traverseNode(item, `${path}[${i}]`, i, query, caseSensitive, results);
    });
  } else {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path === '' ? k : `${path}.${k}`;
      traverseNode(v, childPath, k, query, caseSensitive, results);
    }
  }
}

export function useSearch(value: unknown): UseSearchReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryRaw] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  const matches = useMemo(
    () => collectMatches(value, debouncedQuery, caseSensitive),
    [value, debouncedQuery, caseSensitive],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [matches]);

  const expandPaths = useMemo(() => {
    const activePath = matches[activeIndex]?.path ?? '';
    return new Set(getAncestors(activePath));
  }, [matches, activeIndex]);

  const matchPaths = useMemo(() => new Set(matches.map((m) => m.path)), [matches]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (matches.length === 0 ? 0 : (i + 1) % matches.length));
  }, [matches.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) =>
      matches.length === 0 ? 0 : (i - 1 + matches.length) % matches.length,
    );
  }, [matches.length]);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQueryRaw('');
    setDebouncedQuery('');
  }, []);

  const setQuery = useCallback((q: string) => setQueryRaw(q), []);

  return {
    isOpen,
    open,
    close,
    query,
    setQuery,
    caseSensitive,
    setCaseSensitive,
    matches,
    activeIndex,
    activeMatch: matches[activeIndex] ?? null,
    matchPaths,
    expandPaths,
    goNext,
    goPrev,
  };
}
