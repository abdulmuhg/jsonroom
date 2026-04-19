import { useEffect, useRef } from 'react';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  caseSensitive: boolean;
  onToggleCase: () => void;
  matchCount: number;
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export function SearchBar({
  query,
  onQueryChange,
  caseSensitive,
  onToggleCase,
  matchCount,
  activeIndex,
  onNext,
  onPrev,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.shiftKey ? onPrev() : onNext();
    }
  }

  const hasQuery = query.length > 0;
  const noMatches = hasQuery && matchCount === 0;

  return (
    <div className="flex items-center gap-1 border-b border-bg-elev bg-bg-panel px-3 py-1.5">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search keys and values…"
        className={[
          'flex-1 bg-transparent font-mono text-[13px] font-medium text-ink-primary placeholder:font-normal placeholder:text-ink-subtle focus:outline-none',
          noMatches ? 'text-accent-bool' : '',
        ].join(' ')}
      />
      <button
        onClick={onToggleCase}
        title="Case sensitive"
        aria-pressed={caseSensitive}
        className={[
          'rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors',
          caseSensitive
            ? 'bg-accent-key/20 text-accent-key'
            : 'text-ink-muted hover:text-ink-primary',
        ].join(' ')}
      >
        Aa
      </button>
      {hasQuery && (
        <span className="font-mono text-[11px] text-ink-muted min-w-[3rem] text-right">
          {matchCount === 0 ? '0 / 0' : `${activeIndex + 1} / ${matchCount}`}
        </span>
      )}
      <button
        onClick={onPrev}
        disabled={matchCount === 0}
        aria-label="Previous match"
        className="rounded p-0.5 text-ink-muted hover:text-ink-primary disabled:opacity-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={13} height={13}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
      <button
        onClick={onNext}
        disabled={matchCount === 0}
        aria-label="Next match"
        className="rounded p-0.5 text-ink-muted hover:text-ink-primary disabled:opacity-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={13} height={13}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <button
        onClick={onClose}
        aria-label="Close search"
        className="rounded p-0.5 text-ink-muted hover:text-ink-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width={13} height={13}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
