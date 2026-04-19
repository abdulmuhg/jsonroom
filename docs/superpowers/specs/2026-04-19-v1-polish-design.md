# JSONRoom v1 Polish — Design Spec

**Date:** 2026-04-19
**Scope:** Search (per-pane, highlight + jump) · Copy primitive values · Readability polish

---

## 1. In-Pane Search

### Trigger
A search icon button (magnifying glass SVG) is added to the pane header bar, alongside the existing `Format` and `Clear` buttons. Clicking it opens the search bar. No keyboard shortcut.

### Search Bar
Appears below the pane label/metadata row, above the JSON tree. Slides in on open, slides out on close.

Layout (left → right):
```
[ search input ...................................... ] [ Aa ] [ 3/12 ] [ ↑ ] [ ↓ ] [ × ]
```

- **Input** — autofocused on open, placeholder: `Search keys and values…`
- **Aa** — case-sensitivity toggle; off by default (case-insensitive)
- **Counter** — `3 / 12` in monospace, muted; shows `0 / 0` when no matches; hidden when input is empty
- **↑ / ↓** — previous / next match buttons
- **×** — closes the bar and clears search state; `Esc` also closes

### Matching
- Matches against: object keys, string values, numbers (coerced to string), booleans (`"true"` / `"false"`), `"null"`
- Debounced 150ms after keystroke
- Case-insensitive by default; `Aa` toggles exact-case matching

### Highlights
- All matches: subtle accent-colored background on the matched text span
- Active match (current): brighter distinct highlight (e.g. `accent-key` background)
- Counter reflects active position

### Navigation
- `↑` / `↓` buttons in the bar: previous / next match (wraps around)
- `Enter` inside the input: next match
- `Shift+Enter` inside the input: previous match

### Auto-Expand
- When jumping to a match inside a collapsed node, all ancestor nodes auto-expand to reveal it
- If the user manually collapses a node that contains the active match, the active match advances to the next available match

### Compare Mode
- Each pane maintains completely independent search state
- Opening search on one pane does not affect the other
- The search button appears in each pane's own header

---

## 2. Copy Primitive Values

### Trigger
Hovering any **primitive row** (string, number, boolean, null) in the JSON tree reveals a clipboard icon at the right edge of that row.

### Behaviour
- Click copies the **raw value** to clipboard:
  - String `"hello"` → copies `hello` (no surrounding quotes)
  - Number `42` → copies `42`
  - Boolean `true` → copies `true`
  - Null → copies `null`
- Icon briefly swaps to a checkmark `✓` for 1.5s, then reverts to the clipboard icon

### Visual
- 14×14px SVG icon (clipboard; swaps to check on success)
- `aria-label="Copy value"`
- Visible only on row hover (opacity transition, no layout shift)
- Right-aligned on the primitive row, same baseline as the value text

### Out of Scope (v1.1)
Copying entire object/array subtrees as formatted JSON is deferred. The interaction model (where the copy button lives on a collapsed vs expanded container row, and what format it produces) needs its own design pass.

---

## 3. Readability Polish

| Element | Current state | Change |
|---|---|---|
| `Format` / `Clear` buttons | 11px text, no border, muted gray | 12px, add `border border-bg-elev rounded-md` so they read as buttons not links |
| Search button | Does not exist | Add magnifying glass SVG icon button to pane header, same row as Format/Clear |
| Tab name input (Toolbar) | No focus indicator | Add `border-b border-transparent focus:border-bg-elev` on focus |
| Everything else | — | Unchanged |

---

## Out of Scope for v1

- Drag-and-drop tab content into compare pane
- Filter mode (collapse non-matching branches)
- Regex search
- Copy object/array subtree as JSON
- JSONPath copy
- Table view, presentation mode, command palette
