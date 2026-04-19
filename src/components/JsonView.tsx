import { useMemo, useState } from 'react';

interface Props {
  value: unknown;
  highlightPaths?: Map<string, 'added' | 'removed' | 'changed'>;
}

function typeLabel(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

export function JsonView({ value, highlightPaths }: Props) {
  return (
    <div className="font-mono text-[13px] leading-6 scrollbar-thin overflow-auto p-4">
      <Node
        name={null}
        value={value}
        path=""
        depth={0}
        highlightPaths={highlightPaths}
      />
    </div>
  );
}

interface NodeProps {
  name: string | number | null;
  value: unknown;
  path: string;
  depth: number;
  highlightPaths?: Map<string, 'added' | 'removed' | 'changed'>;
  trailingComma?: boolean;
}

function Node({ name, value, path, depth, highlightPaths, trailingComma }: NodeProps) {
  const [open, setOpen] = useState(depth < 2);
  const kind = typeLabel(value);
  const highlight = highlightPaths?.get(path);

  const hlClass = useMemo(() => {
    if (!highlight) return '';
    if (highlight === 'added') return 'bg-diff-addBg border-l-2 border-diff-add pl-1';
    if (highlight === 'removed') return 'bg-diff-removeBg border-l-2 border-diff-remove pl-1';
    return 'bg-diff-changeBg border-l-2 border-diff-change pl-1';
  }, [highlight]);

  const indent = { paddingLeft: `${depth * 16}px` };

  if (kind === 'array' || kind === 'object') {
    const entries =
      kind === 'array'
        ? (value as unknown[]).map((v, i) => [i, v] as const)
        : Object.entries(value as Record<string, unknown>);
    const open_br = kind === 'array' ? '[' : '{';
    const close_br = kind === 'array' ? ']' : '}';

    return (
      <div className={hlClass} style={indent}>
        <div className="flex items-start">
          <button
            onClick={() => setOpen((o) => !o)}
            className="mr-1 -ml-4 w-3 text-ink-muted hover:text-ink-primary"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▾' : '▸'}
          </button>
          {name !== null && (
            <>
              <span className="text-accent-key">
                {typeof name === 'number' ? name : `"${name}"`}
              </span>
              <span className="text-ink-muted mx-1">:</span>
            </>
          )}
          <span className="text-ink-secondary">{open_br}</span>
          {!open && (
            <span className="ml-2 text-ink-muted text-[11px] uppercase tracking-wider">
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </span>
          )}
          {!open && <span className="text-ink-secondary">{close_br}{trailingComma ? ',' : ''}</span>}
        </div>
        {open && (
          <>
            {entries.map(([k, v], idx) => (
              <Node
                key={String(k)}
                name={k as string | number}
                value={v}
                path={
                  kind === 'array'
                    ? `${path}[${k}]`
                    : path === ''
                      ? String(k)
                      : `${path}.${String(k)}`
                }
                depth={depth + 1}
                highlightPaths={highlightPaths}
                trailingComma={idx < entries.length - 1}
              />
            ))}
            <div style={{ paddingLeft: `${depth * 16}px` }} className="text-ink-secondary">
              {close_br}{trailingComma ? ',' : ''}
            </div>
          </>
        )}
      </div>
    );
  }

  // Primitives.
  return (
    <div className={hlClass} style={indent}>
      {name !== null && (
        <>
          <span className="text-accent-key">
            {typeof name === 'number' ? name : `"${name}"`}
          </span>
          <span className="text-ink-muted mx-1">:</span>
        </>
      )}
      <PrimitiveValue value={value} />
      {trailingComma && <span className="text-ink-muted">,</span>}
    </div>
  );
}

function PrimitiveValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-accent-bool">null</span>;
  if (typeof value === 'string') return <span className="text-accent-string">"{value}"</span>;
  if (typeof value === 'number') return <span className="text-accent-number">{value}</span>;
  if (typeof value === 'boolean') return <span className="text-accent-bool">{String(value)}</span>;
  return <span>{String(value)}</span>;
}
