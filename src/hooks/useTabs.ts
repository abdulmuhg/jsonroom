import { useCallback, useEffect, useState } from 'react';

export type ViewMode = 'single' | 'compare';

export interface Tab {
  id: string;
  name: string;
  mode: ViewMode;
  leftRaw: string;
  rightRaw: string;
}

const STORAGE_KEY = 'jsonpeek.tabs.v1';

function newTabId(): string {
  return `t_${Math.random().toString(36).slice(2, 9)}`;
}

function emptyTab(name = 'New tab'): Tab {
  return {
    id: newTabId(),
    name,
    mode: 'single',
    leftRaw: '',
    rightRaw: '',
  };
}

interface PersistedState {
  tabs: Tab[];
  activeId: string;
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') {
    const t = emptyTab();
    return { tabs: [t], activeId: t.id };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.tabs?.length) return parsed;
    }
  } catch {
    // Fall through to default.
  }
  const t = emptyTab();
  return { tabs: [t], activeId: t.id };
}

export function useTabs() {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded — ignore for now.
    }
  }, [state]);

  const addTab = useCallback(() => {
    setState((s) => {
      const t = emptyTab(`Tab ${s.tabs.length + 1}`);
      return { tabs: [...s.tabs, t], activeId: t.id };
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setState((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      if (idx === -1) return s;
      const next = s.tabs.filter((t) => t.id !== id);
      if (next.length === 0) {
        const t = emptyTab();
        return { tabs: [t], activeId: t.id };
      }
      const activeId =
        s.activeId === id ? next[Math.max(0, idx - 1)].id : s.activeId;
      return { tabs: next, activeId };
    });
  }, []);

  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setState((s) => ({
      ...s,
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const setActive = useCallback((id: string) => {
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const activeTab = state.tabs.find((t) => t.id === state.activeId) ?? state.tabs[0];

  return {
    tabs: state.tabs,
    activeId: state.activeId,
    activeTab,
    addTab,
    closeTab,
    updateTab,
    setActive,
  };
}
