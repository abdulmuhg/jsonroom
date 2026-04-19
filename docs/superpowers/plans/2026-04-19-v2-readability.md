# JSONRoom v2 Readability Pass

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift JSONRoom's visual language toward JSON.site's calm, data-first look while keeping the warm orange/gold data accents that make it ours. Net result: easier to read long JSON, less UI chrome competing with content, better affordances (line numbers, indent guides, smarter copy button, slimmer chevrons).

**Design direction (hybrid):**
- **UI chrome** (backgrounds, borders, button text, muted metadata): cool blue-gray neutrals.
- **Data accents** (keys, strings, numbers, booleans): keep current warm palette so syntax-highlighted data still feels like JSONRoom.
- **Density & typography**: adopt JSON.site's quieter details — unquoted keys in tree view, line numbers, indent guides, slim chevrons, ghost icon buttons.

**Non-goals:**
- No table / grid view. Single tree view only.
- No syntax-editor for input — textarea + parse stays.
- No light mode. Dark only.

**Tech stack:** Vite, React 18, TypeScript, Tailwind CSS 3. No new runtime deps.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `tailwind.config.js` | Re-palette UI chrome tokens; keep data accents |
| Modify | `src/components/JsonView.tsx` | Line numbers, indent guides, unquoted keys, slim chevrons, inline-end copy button |
| Modify | `src/components/Pane.tsx` | Icon-only ghost buttons for Format / Clear / Compare |
| Modify | `src/components/SearchBar.tsx` | Re-skin against new chrome tokens |
| Modify | `src/components/TabBar.tsx` | Re-skin against new chrome tokens |
| Modify | `src/App.tsx` | Re-skin header against new chrome tokens |

No new files, no new tests (existing 19 `useSearch` tests must still pass — pure visual/structural change).

---

## Task 1: Re-palette UI Chrome Tokens

**Files:**
- Modify: `tailwind.config.js`

The idea: keep `accent.*` (key/string/number/bool) warm. Replace `bg.*`, `ink.*` with cooler blue-gray values that match JSON.site's chrome. Add new tokens for indent guides and line-number gutter.

- [ ] **Step 1: Update `tailwind.config.js`**

Replace the `theme.extend.colors` block with:

```js
colors: {
  // UI chrome — cool blue-gray neutrals (JSON.site-inspired).
  bg: {
    base: '#1a1e26',      // outer canvas, deeper cool gray
    panel: '#22272f',     // pane / toolbar background
    elev: '#2c323b',      // borders, elevated chips
    hover: '#343a44',     // button hover
    gutter: '#1e232b',    // line-number gutter bg
  },
  ink: {
    primary: '#d8dde5',   // body text — slightly cooler than before
    secondary: '#a8b0bc', // secondary labels
    muted: '#7a8390',     // metadata, keys in muted state
    subtle: '#4e5662',    // placeholder, line numbers, indent guides
  },
  // Data accents — stay warm, this is JSONRoom's identity.
  accent: {
    key: '#E07B4F',       // orange — JSON keys
    string: '#E8C07D',    // gold — strings
    number: '#9CDCFE',    // cool blue — numbers
    bool: '#D47B7B',      // coral — booleans/null
  },
  diff: {
    add: '#4A7C59',
    addBg: 'rgba(74, 124, 89, 0.18)',
    remove: '#8B4949',
    removeBg: 'rgba(139, 73, 73, 0.18)',
    change: '#B8864A',
    changeBg: 'rgba(184, 134, 74, 0.18)',
  },
  search: {
    match: 'rgba(232, 192, 125, 0.18)',
    matchBorder: 'rgba(232, 192, 125, 0.45)',
    active: 'rgba(140, 95, 30, 0.55)',
    activeBorder: '#E8C07D',
  },
},
```

Key changes from v1:
- `bg.base` `#0E1116` → `#1a1e26` (cooler, slightly lighter — matches JSON.site)
- `bg.panel` `#1A1F28` → `#22272f` (cooler hue)
- `bg.elev` `#232935` → `#2c323b`
- `bg.hover` `#2A3140` → `#343a44`
- New `bg.gutter` for line-number column
- `ink.*` shifted to cooler, slightly lighter tones
- `accent.*` unchanged — warm data highlights stay
- New `ink.subtle` doubles as indent-guide color

- [ ] **Step 2: Visual sanity check**

Start the dev server, open a populated tab:

```bash
npm run dev
```

Verify: overall feel should be calmer and more neutral; the orange keys and gold strings should still pop but the surrounding UI no longer feels warm. If any text is illegible, adjust `ink.*` before moving on — downstream tasks rely on these tokens.

---

## Task 2: Rewrite `JsonView.tsx` — Line Numbers, Indent Guides, Unquoted Keys, Slim Chevrons, Inline-End Copy

**Files:**
- Modify: `src/components/JsonView.tsx`

This is the biggest structural change. Four sub-goals:

1. **Line numbers**: a left gutter showing 1-based line numbers, one per visual row (including closing brackets).
2. **Indent guides**: faint vertical line at every depth level inside the tree body.
3. **Unquoted keys in the tree**: render `message:` not `"message":`. Search highlighting still works over the unquoted text.
4. **Slim chevrons**: swap `▸ ▾` unicode triangles for lightweight SVG chevrons.
5. **Inline-end copy button**: move the copy button from row-end to immediately after the value text — not the far right of the row. Still hover-to-reveal, but visually attached to the value it copies.

### Step 2a — Data structure for rendering

The current `Node` component recursively renders. To get line numbers right, each "visual row" needs an index. Two options:

- **Option A (recommended):** keep recursive rendering, but pass a mutable line counter via a context or a ref. Each row reads-and-increments the counter as it renders.
- **Option B:** flatten to an array of rows first, then render. Cleaner but more refactor.

Go with **Option A** — smaller diff, same result.

- [ ] **Step 1: Add a line-counter ref at the root**

At the top of `JsonView`:

```tsx
import { useRef } from 'react';

// Inside the component, above the return:
const lineCounterRef = useRef({ value: 0 });
// Reset on every render so line numbers match the current tree.
lineCounterRef.current.value = 0;
```

Pass it down via a new optional prop `lineCounter` on `Node` and forward it into the `childProps` spread. Inside `Node`, the opening line and the closing line each call `const lineNo = ++lineCounterRef.current.value;`.

### Step 2b — Render the gutter + content as two columns

- [ ] **Step 2: Restructure `JsonView` into a two-column layout**

```tsx
<div className="font-mono text-[13px] leading-6 scrollbar-thin overflow-auto">
  <div className="flex">
    {/* Line-number gutter — rendered as absolutely-positioned numbers per row
        is messy; simpler approach: render each row as <div className="flex"> with
        a gutter cell and a content cell. See Step 3. */}
  </div>
</div>
```

Better: make every rendered "visual row" (the `<div className="flex items-start">` in Node) be a flex container with a `LineNumber` cell on the left and the content on the right. The gutter cell has a fixed width (`w-10`), right-aligned number, `text-ink-subtle` text, `bg-bg-gutter` background.

Concretely, change the container row inside `Node` from:

```tsx
<div className="flex items-start ..."> ... </div>
```

to:

```tsx
<Row lineNo={lineNo}>
  <div className="flex items-start ..."> ... </div>
</Row>
```

Where `Row` is a tiny helper:

```tsx
function Row({ lineNo, children, className }: { lineNo: number; children: ReactNode; className?: string }) {
  return (
    <div className={['flex', className].filter(Boolean).join(' ')}>
      <div className="w-10 flex-shrink-0 select-none bg-bg-gutter text-right pr-2 text-ink-subtle text-[11px] leading-6">
        {lineNo}
      </div>
      <div className="flex-1 min-w-0 pl-3">
        {children}
      </div>
    </div>
  );
}
```

Every "row" inside `Node` — the opening bracket row, each child (recursed), and the closing bracket row — must be wrapped in `<Row>` with its own `lineNo`. Primitives are a single row.

### Step 2c — Indent guides

- [ ] **Step 3: Add indent guides**

Remove the current `style={indent}` (`paddingLeft: depth * 16`). Instead, render `depth` spacer columns inside the content cell, each one 16px wide with a left border that becomes the indent guide:

```tsx
function Indent({ depth }: { depth: number }) {
  return (
    <>
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-4 border-l border-ink-subtle/30 h-6 align-middle"
          aria-hidden
        />
      ))}
    </>
  );
}
```

Use `border-ink-subtle/30` or similar — the guide should be visible but not compete with content. Tune opacity after Step 1's palette check.

Place `<Indent depth={depth} />` before the chevron in every row.

### Step 2d — Unquoted keys

- [ ] **Step 4: Remove quotes around key names**

In both the container `name !== null` block and the primitive `name !== null` block, change:

```tsx
{typeof name === 'number' ? name : `"${name}"`}
```

to:

```tsx
{typeof name === 'number' ? `[${name}]` : name}
```

Two changes in that line:
- String keys no longer have surrounding `"..."`.
- Array indices use `[0]` format instead of a bare `0`, for visual distinction (matches how paths are written elsewhere).

Update the `HighlightText` calls the same way so search highlighting works on unquoted text.

**Important:** the `PrimitiveValue` still renders string *values* with quotes (`"hello"`). Only keys lose their quotes.

### Step 2e — Slim chevrons

- [ ] **Step 5: Replace `▾ ▸` unicode triangles with SVG chevrons**

Create a tiny `Chevron` component:

```tsx
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      width={10}
      height={10}
      className={['transition-transform', open ? 'rotate-90' : ''].join(' ')}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
    </svg>
  );
}
```

Replace:

```tsx
<button onClick={() => setOpen((o) => !o)} className="mr-1 -ml-4 w-3 text-ink-muted hover:text-ink-primary" aria-label={open ? 'Collapse' : 'Expand'}>
  {open ? '▾' : '▸'}
</button>
```

with:

```tsx
<button onClick={() => setOpen((o) => !o)} className="mr-1 flex h-6 w-4 items-center justify-center text-ink-muted hover:text-ink-primary" aria-label={open ? 'Collapse' : 'Expand'}>
  <Chevron open={open} />
</button>
```

Note: the `-ml-4` offset is dropped because with indent guides, the chevron now lives inside the content area at its natural position, not nudged back into the indent column.

### Step 2f — Inline-end copy button

- [ ] **Step 6: Move the copy button next to the value, not the row end**

Current primitive row:

```tsx
<div className="group flex items-center">
  <div className="flex flex-1 items-center ...">
    {/* key, :, value */}
  </div>
  <CopyButton value={value} />
</div>
```

The CopyButton sits outside the inner flex, pushed to the far right by `flex-1` on the inner div. Change to:

```tsx
<div className="group flex items-center">
  <div className="flex items-center ...">
    {/* key, :, value */}
    <CopyButton value={value} />
    {trailingComma && <span className="text-ink-muted">,</span>}
  </div>
</div>
```

Key changes:
- Drop `flex-1` on the inner div so it shrink-wraps around the content.
- `CopyButton` moves inside, immediately after the value and before the trailing comma.
- `CopyButton`'s own `ml-2` stays — gives breathing room after the value.

Also verify containers: the plan leaves containers without a copy button (they don't copy well as text). Confirm — if you want containers to be copyable later, that's a separate feature.

### Step 2g — Verify + commit

- [ ] **Step 7: Run tests**

```bash
npm test
```

Existing 19 `useSearch` tests must still pass — they exercise pure functions untouched by this refactor.

- [ ] **Step 8: Build**

```bash
npm run build
```

Zero TypeScript errors.

- [ ] **Step 9: Visual check**

Paste the sample JSON from Task 7 of v1-polish plus a deeply nested example. Verify:
- Line numbers render 1 through N, one per visible row, including closing brackets.
- Indent guides visible as faint vertical lines at each depth.
- Keys render without quotes (`message:` not `"message":`).
- String *values* still have quotes.
- Array children render their index as `[0]`, `[1]`, etc.
- Chevrons are slim lines, rotate on toggle.
- Copy button appears on hover immediately after the value, not at row edge.

- [ ] **Step 10: Commit**

```bash
git add src/components/JsonView.tsx tailwind.config.js
git commit -m "feat: v2 readability — line numbers, indent guides, unquoted keys, slim chevrons, inline copy"
```

---

## Task 3: Pane Header — Icon-Only Ghost Buttons

**Files:**
- Modify: `src/components/Pane.tsx`

Current: Format / Clear / Compare are text buttons with borders. Search is an icon button with a border.

Target: all four become bordered icon-only buttons with a tooltip (`title`) so affordance doesn't suffer. Matches JSON.site's dense icon toolbar.

- [ ] **Step 1: Replace Format / Clear / Compare with icon buttons**

For each button:
- Keep the `rounded border border-bg-elev px-2 py-1` skeleton.
- Replace the text label with an SVG icon (see list below).
- Keep the `title` attribute so hover shows the text label.
- Keep active/disabled state colors.

Icons (use Heroicons outline style, 14×14):
- **Format**: `document-text` or a custom "pretty-print" bracket icon. Heroicons path: `M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5`. (Three horizontal lines — reads as "format/layout".) Alternative: `bars-3`.
- **Clear**: `trash` — `m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0`. A simple trash icon.
- **Compare**: `arrows-right-left` — `M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5`. Two-way arrows.
- **Search**: already an icon. Leave as-is but bump to 14×14 for consistency.

Pattern for each button:

```tsx
<button
  onClick={...}
  disabled={...}
  title="Format"
  aria-label="Format"
  className="rounded border border-bg-elev px-2 py-1 text-ink-muted hover:bg-bg-hover hover:text-ink-primary disabled:opacity-40"
>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="..." />
  </svg>
</button>
```

- [ ] **Step 2: Verify button group width and alignment**

With icons of the same size, the four buttons should form a tidy row with consistent gap. Check in both single and compare modes.

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Pane.tsx
git commit -m "feat: v2 readability — icon-only ghost buttons in Pane header"
```

---

## Task 4: Re-skin SearchBar, TabBar, App Header

**Files:**
- Modify: `src/components/SearchBar.tsx`
- Modify: `src/components/TabBar.tsx`
- Modify: `src/App.tsx`

The new `bg.*` / `ink.*` tokens from Task 1 take effect automatically because these files reference them by name. However, there are a few hard-coded color values and opacity tweaks to revisit.

- [ ] **Step 1: Audit SearchBar**

Nothing should need structural change — the tokens flow through. Spot-check the `noMatches` state: on the new cooler panel, `text-accent-bool` (`#D47B7B`) should still read as "error". If it looks muddy, consider `text-[#f28b82]` or a new `accent.error` token.

- [ ] **Step 2: Audit TabBar**

Same — tokens flow through. One thing to check: the `border-b border-accent-key/60` on the inline-edit input. With the cooler chrome, keeping the warm accent-key border is what gives editing its "hot" affordance, so leave it.

- [ ] **Step 3: Audit App header**

Currently: `font-mono text-accent-key font-bold` for the `{ }` logo. With the cooler chrome this still pops — good. The `meet Mr. J` and external-site links use `text-ink-muted hover:text-accent-key`; verify they're legible against the new `bg.panel`.

- [ ] **Step 4: Build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchBar.tsx src/components/TabBar.tsx src/App.tsx
git commit -m "chore: v2 readability — audit chrome-dependent components for new palette"
```

(Only commit the files that actually changed. If all three need no edits, skip the commit.)

---

## Task 5: Full-App Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Visual regression checks**

For each of these, compare the "before" (current v1) and "after" (v2) side-by-side if possible:

1. **Palette**: overall feel should be calmer, cooler. Orange keys and gold strings still pop.
2. **Line numbers**: visible in left gutter, 1-indexed, one per row, including closing brackets. Color should be muted (ink.subtle).
3. **Indent guides**: faint vertical lines at each depth level inside the tree.
4. **Unquoted keys**: `message:` not `"message":`. Array children show as `[0]`, `[1]`.
5. **Chevrons**: slim lines, rotate on toggle, not filled triangles.
6. **Copy button**: hover any primitive row — copy icon appears immediately after the value, not at row edge. Click copies, shows check briefly.
7. **Header buttons**: Search / Format / Clear / Compare all icon-only, same size, consistent border. Tooltips on hover.
8. **Search**: open search, type a query. Match highlighting still works on unquoted keys. Counter still readable.
9. **Compare mode**: left pane has Compare button active, right pane doesn't show it. Diff counter appears in left-pane metadata.
10. **Tabs**: double-click to rename still works. Tab border/hover colors look right against the new panel bg.
11. **Deep nesting**: paste a 4+ level nested JSON. Indent guides should make nesting scannable. Line numbers should count correctly through closing brackets.

- [ ] **Step 3: Final commit**

User will do this themselves after manual verification.

```bash
git add -A
git commit -m "chore: v2 readability pass complete"
```

---

## Deferred / Future

Things considered but left out of this plan:

- **Table view** for arrays of homogeneous objects (like JSON.site's blue grid). Big feature, deserves its own plan.
- **Copyable containers**: copying a whole `{...}` block as formatted JSON. Separate feature.
- **Collapse-all / expand-all buttons**. Nice-to-have, not in scope.
- **Light mode**. Out of scope — JSONRoom is dark-only for now.
- **Syntax-colored editor** for input. The textarea stays; editor would be a separate project.

---

## Risk notes

- **Indent guides + line numbers interaction**: both are left-side visual elements. The guides live inside the content cell; the numbers live in a separate gutter cell. No overlap, but verify spacing after Task 2.
- **Line numbers accuracy**: the mutable-counter approach works only if render order matches visual order. React concurrent mode / Suspense would break this. Current app doesn't use either — safe for now. If you ever migrate, switch to the flatten-first approach (Option B in Task 2a).
- **Unquoted keys and search**: `HighlightText` receives the raw key name. Confirm matching against `"message"` vs `message` still works — search query `mes` should highlight `mes` inside `message:` exactly the same way.
- **Inline-end copy button and trailing commas**: the comma has to render *after* the copy button, otherwise it visually separates the value from the copy icon. Verify spacing looks right in arrays where most rows have trailing commas.
