import { useEffect, useState } from 'react';

interface Props {
  onDismiss: () => void;
}

interface Line {
  speaker: string;
  text: string;
}

const SCRIPT: Line[] = [
  { speaker: '???', text: '*knock knock*' },
  { speaker: '???', text: 'Uhh… excuse me. Is this the Jason room?' },
  { speaker: 'Mr. J', text: 'Close — but this is the JSON Room.' },
  { speaker: 'Mr. J', text: "Come on in. I'll hold your payloads." },
  {
    speaker: 'Mr. J',
    text: 'Paste messy logs, escaped strings, whole Grafana responses — I\'ll clean them up.',
  },
  {
    speaker: 'Mr. J',
    text: 'Open as many tabs as you need. Hit ⌘D to compare two payloads side-by-side.',
  },
  {
    speaker: 'Mr. J',
    text: "Oh — and this place is built by Abdul. Fork it, star it, or just use it. No ads, no sign-up, ever.",
  },
];

function useTypewriter(text: string, speed = 22) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown('');
    setDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  const reveal = () => {
    setShown(text);
    setDone(true);
  };

  return { shown, done, reveal };
}

function PortraitFrame({ speaker, className = '' }: { speaker: string; className?: string }) {
  const isKnown = speaker === 'Mr. J';
  return (
    <div
      className={
        'relative overflow-hidden rounded-lg border-2 border-accent-key/60 bg-bg-panel/95 shadow-2xl ' +
        className
      }
    >
      {isKnown ? (
        <img
          src="/mr-j.png"
          alt="Mr. J, the JSONRoom host"
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-bg-elev">
          <span className="font-mono text-4xl text-ink-subtle">?</span>
        </div>
      )}
      {/* JRPG corner accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-accent-key" />
        <div className="absolute right-1 top-1 h-3 w-3 border-r-2 border-t-2 border-accent-key" />
        <div className="absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-accent-key" />
        <div className="absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-accent-key" />
      </div>
    </div>
  );
}

export function Intro({ onDismiss }: Props) {
  const [index, setIndex] = useState(0);
  const line = SCRIPT[index];
  const { shown, done, reveal } = useTypewriter(line.text);

  const isLast = index === SCRIPT.length - 1;

  const advance = () => {
    if (!done) {
      reveal();
      return;
    }
    if (isLast) {
      onDismiss();
    } else {
      setIndex((i) => i + 1);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, done]);

  return (
    <div
      role="dialog"
      aria-label="Welcome to JSONRoom"
      className="fixed inset-0 z-50 flex flex-col bg-bg-base text-ink-primary"
      onClick={advance}
    >
      {/* Background scene — cover on mobile (portrait viewport fills nicely),
          contain on desktop (shows full room + door) */}
      <img
        src="/door-scene.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_30%] opacity-30 pointer-events-none select-none md:object-contain md:object-bottom md:opacity-25"
      />
      {/* Vignette to push background further back */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-bg-base/40 pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
          JSON Room
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="rounded px-3 py-1 text-xs uppercase tracking-wider text-ink-muted hover:bg-bg-hover hover:text-ink-primary"
        >
          Skip →
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section */}
      <div className="relative z-10 pb-6 px-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-end gap-4">
          {/* Dialog box */}
          <div
            className="flex-1 rounded-lg border-2 border-accent-key/60 bg-bg-panel/95 shadow-2xl"
            onClick={(e) => {
              e.stopPropagation();
              advance();
            }}
          >
            <div className="flex items-center gap-2 border-b border-accent-key/40 bg-bg-elev px-3 py-2 sm:px-4">
              {/* Inline portrait badge — mobile only */}
              <div className="md:hidden h-8 w-8 flex-shrink-0">
                <PortraitFrame speaker={line.speaker} className="h-8 w-8" />
              </div>
              <span className="h-2 w-2 rounded-full bg-accent-key" />
              <span className="font-mono text-xs uppercase tracking-widest text-accent-key">
                {line.speaker}
              </span>
            </div>
            <div className="min-h-[80px] px-5 py-4 sm:min-h-[96px] sm:px-6 sm:py-5">
              <p className="text-base leading-relaxed text-ink-primary sm:text-lg">
                {shown}
                <span
                  className={
                    'ml-0.5 inline-block h-5 w-2 align-middle bg-ink-primary ' +
                    (done ? 'animate-pulse' : 'opacity-60')
                  }
                />
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-bg-elev px-3 py-2 text-[11px] text-ink-muted sm:px-4">
              <span>
                {index + 1} / {SCRIPT.length}
              </span>
              {/* Keyboard hints — desktop only */}
              <span className="hidden items-center gap-3 sm:flex">
                <span>
                  <kbd className="rounded bg-bg-elev px-1.5 py-0.5 font-mono">Space</kbd>{' '}
                  {done ? (isLast ? 'enter' : 'next') : 'fast-forward'}
                </span>
                <span>
                  <kbd className="rounded bg-bg-elev px-1.5 py-0.5 font-mono">Esc</kbd> skip
                </span>
              </span>
              {/* Mobile tap hint */}
              <span className="italic sm:hidden">tap to continue</span>
            </div>
          </div>

          {/* Desktop: portrait frame on right of dialog */}
          <PortraitFrame
            speaker={line.speaker}
            className="hidden md:block aspect-square w-44 flex-shrink-0 lg:w-52"
          />
        </div>
      </div>
    </div>
  );
}
