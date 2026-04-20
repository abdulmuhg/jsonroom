import { useEffect, useMemo, useState } from 'react';
import { TabBar } from './components/TabBar';
import { Pane } from './components/Pane';
import { Intro } from './components/Intro';
import { useTabs } from './hooks/useTabs';
import { parseJson } from './lib/parseJson';
import { diffJson } from './lib/diff';

const INTRO_SEEN_KEY = 'jsonroom.introSeen.v1';

function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('intro') === '1') return true;
  if (params.get('intro') === '0') return false;
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}

export default function App() {
  const { tabs, activeId, activeTab, addTab, closeTab, updateTab, setActive } = useTabs();
  const [showIntro, setShowIntro] = useState<boolean>(() => shouldShowIntro());

  const dismissIntro = () => {
    setShowIntro(false);
    try {
      localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Ignore.
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showIntro) return; // Intro handles its own keys.
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === 'w') {
        e.preventDefault();
        closeTab(activeId);
      } else if (e.key === 'd') {
        e.preventDefault();
        updateTab(activeId, {
          mode: activeTab.mode === 'compare' ? 'single' : 'compare',
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, activeTab, addTab, closeTab, updateTab, showIntro]);

  const diffEntries = useMemo(() => {
    if (activeTab.mode !== 'compare') return [];
    const l = parseJson(activeTab.leftRaw);
    const r = parseJson(activeTab.rightRaw);
    if (!l.ok || !r.ok) return [];
    return diffJson(l.value, r.value);
  }, [activeTab]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-bg-elev bg-bg-panel px-4 py-2">
        <div className="flex items-center gap-2.5">
          {/* Brand mark — mirrors favicon.svg */}
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#1a1e26"/>
            <path d="M13.5 7.5H12C10.3 7.5 9.5 8.4 9.5 10v3.5c0 .9-.35 1.3-.9 1.5v1c.55.2.9.6.9 1.5V21c0 1.6.8 2.5 2.5 2.5h1.5" stroke="#E07B4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 7.5H20c1.7 0 2.5.9 2.5 2.5v3.5c0 .9.35 1.3.9 1.5v1c-.55.2-.9.6-.9 1.5V21c0 1.6-.8 2.5-2.5 2.5h-1.5" stroke="#E07B4F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="1.6" fill="#E8C07D"/>
          </svg>
          <span className="font-semibold tracking-tight text-ink-primary">JSONRoom</span>
          <span className="hidden sm:inline text-[11px] text-ink-subtle">·</span>
          <span className="hidden sm:inline text-[11px] text-ink-subtle">a quiet room for your JSON</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <kbd className="rounded bg-bg-elev px-1.5 py-0.5 font-mono">Ctrl+D</kbd>
          <span>compare</span>
          <button
            onClick={() => setShowIntro(true)}
            className="ml-3 text-ink-muted hover:text-accent-key"
            title="Replay intro"
          >
            meet Mr. J
          </button>
          <a
            href="https://github.com/abdulmuhg/jsonroom"
            target="_blank"
            rel="noreferrer"
            className="text-ink-muted hover:text-accent-key"
          >
            contribute
          </a>
        </div>
      </header>

      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSelect={setActive}
        onClose={closeTab}
        onAdd={addTab}
        onRename={(id, name) => updateTab(id, { name })}
      />

      {/* Panes */}
      <main className="flex min-h-0 flex-1">
        <Pane
          label={activeTab.mode === 'compare' ? 'Left' : 'JSON'}
          raw={activeTab.leftRaw}
          onChange={(raw) => updateTab(activeId, { leftRaw: raw })}
          diffEntries={activeTab.mode === 'compare' ? diffEntries : undefined}
          diffSide="left"
          showCompareButton
          isCompareMode={activeTab.mode === 'compare'}
          onToggleCompare={() =>
            updateTab(activeId, {
              mode: activeTab.mode === 'compare' ? 'single' : 'compare',
            })
          }
          diffCount={diffEntries.length}
        />
        {activeTab.mode === 'compare' && (
          <>
            <div className="w-px bg-bg-elev" />
            <Pane
              label="Right"
              raw={activeTab.rightRaw}
              onChange={(raw) => updateTab(activeId, { rightRaw: raw })}
              diffEntries={diffEntries}
              diffSide="right"
            />
          </>
        )}
      </main>

      {showIntro && <Intro onDismiss={dismissIntro} />}
    </div>
  );
}
