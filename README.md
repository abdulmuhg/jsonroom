# JSONRoom

A quiet, ad-free room for your JSON. A viewer, formatter, fixer, and side-by-side diff tool built for debugging API responses with your team — especially when you're sharing your screen.

Live at **[json.abdulmughnialfikri.com](https://jsonroom.abdulmughnialfikri.com)**. Contribute at **[github.com/abdulmuhg/jsonroom](https://github.com/abdulmuhg/jsonroom)**.

## Why this exists

Most online JSON tools are loud — ads, upsells, "sign in to save" nags, and ten features you never use. JSONRoom is the opposite. It's a small, focused tool that does a few things very well:

- **Paste messy JSON** from anywhere (Grafana log lines, escaped strings, quoted responses) and see it cleanly formatted
- **Fix broken JSON** — trailing commas, single quotes, unquoted keys, JS literals, missing brackets and more, all repaired in one click
- **Compare two payloads** side-by-side with clear highlights of added, removed, and changed keys
- **Copy with confidence** — one-click copy for individual values, entire blocks, or the whole document
- **Work with multiple tabs** for the 2–3 requests you're triaging at once
- **Look good on a projector or Zoom share**, with a high-contrast dark theme designed for readability

## Meet Mr. J

JSONRoom is hosted by **Mr. J** — a polite fellow who opens the door when you arrive. First-time visitors get a brief JRPG-style intro; regulars never see it again. You can also replay the intro anytime from the header, or link directly with `?intro=1`.

## Features

- A warm welcome on first visit (skippable, shown once)
- High-contrast dark theme optimized for screen sharing
- Smart paste — auto-unescapes double-escaped JSON and strips log-line prefixes
- Fix broken JSON — repairs trailing commas, single quotes, unquoted keys, comments, missing commas, JS literals (`undefined`, `NaN`, `Infinity`), and mismatched brackets
- Copy all — one-click copy button for the entire JSON in each pane
- Copy block — hover any object or array to copy the whole block as formatted JSON
- Clean selection — manual text selection copies clean JSON instead of messy HTML artifacts
- Search with keyboard navigation, case-sensitive toggle, and match highlighting
- Multi-tab workspace with localStorage persistence
- Side-by-side compare with clear diff highlights
- Keyboard shortcuts (`⌘T` / `Ctrl+T` for new tab, `⌘D` / `Ctrl+D` to toggle compare, `⌘F` / `Ctrl+F` to search)
- Zero ads, zero tracking, zero sign-up — everything runs locally in your browser

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS for the theme system
- Pure client-side — no backend, no data leaves your browser

## Running locally

```bash
npm install
npm run dev
```

## Building for production

```bash
npm run build
npm run preview
```

## Roadmap

Small, focused scope. Contributions welcome:

- [ ] Table view for arrays of objects
- [ ] Command palette (`Cmd/Ctrl + K`)
- [ ] Copy JSONPath from any node (context menu)
- [ ] Light theme (opt-in)
- [ ] Import from URL (with optional CORS proxy)
- [ ] Semantic diff mode (ignore key ordering, treat arrays as sets)
- [ ] Presentation mode (boost font, hide chrome)

## Contributing

PRs and issues welcome. Guiding principle: **if a feature would add more than a line of UI chrome, think twice.** JSONRoom exists to be uncluttered.

## License

MIT. See [LICENSE](LICENSE).

---

If JSONRoom is useful to you, a ⭐ on [the repo](https://github.com/abdulmuhg/jsonroom) goes a long way.
