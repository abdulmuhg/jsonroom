import { useEffect, useMemo, useState } from 'react';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
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
      if (e.key === 't') {
        e.preventDefault();
        addTab();
      } else if (e.key === 'w') {
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
        <div className="flex items-center gap-2">
          <span className="font-mono text-accent-key font-bold text-lg">{'{ }'}</span>
          <span className="font-semibold text-ink-primary">JSONRoom</span>
          <span className="text-[11px] uppercase tracking-wider text-ink-muted">
            a quiet room for your JSON
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <kbd className="rounded bg-bg-elev px-1.5 py-0.5 font-mono">⌘T</kbd>
          <span>new tab</span>
          <kbd className="rounded bg-bg-elev px-1.5 py-0.5 font-mono">⌘D</kbd>
          <span>compare</span>
          <button
            onClick={() => setShowIntro(true)}
            className="ml-3 text-ink-muted hover:text-accent-key"
            title="Replay intro"
          >
            meet Mr. J
          </button>
          <a
            href="https://abdulmughnialfikri.com"
            target="_blank"
            rel="noreferrer"
            className="text-ink-muted hover:text-accent-key"
          >
            abdulmughnialfikri.com
          </a>
        </div>
      </header>

      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSelect={setActive}
        onClose={closeTab}
        onAdd={addTab}
      />

      <Toolbar
        tab={activeTab}
        diffCount={diffEntries.length}
        onToggleMode={() =>
          updateTab(activeId, {
            mode: activeTab.mode === 'compare' ? 'single' : 'compare',
          })
        }
        onRename={(name) => updateTab(activeId, { name })}
      />

      {/* Panes */}
      <main className="flex min-h-0 flex-1">
        <Pane
          label={activeTab.mode === 'compare' ? 'Left' : 'JSON'}
          raw={activeTab.leftRaw}
          onChange={(raw) => updateTab(activeId, { leftRaw: raw })}
          diffEntries={activeTab.mode === 'compare' ? diffEntries : undefined}
          diffSide="left"
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
