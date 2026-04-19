# JSONPeek

A clean, ad-free JSON viewer and diff tool for debugging API responses — built for screen-sharing with your team.

Live at **[json.abdulmughnialfikri.com](https://json.abdulmughnialfikri.com)**.

## Why

Most online JSON editors are cluttered with ads, upsells, and features you never use. JSONPeek is the opposite — a small, focused tool that does four things very well:

- **Paste messy JSON** from anywhere (Grafana log lines, escaped strings, quoted responses) and see it cleanly formatted.
- **Compare two payloads** side-by-side with synchronized highlights of added, removed, and changed keys.
- **Work with multiple tabs** for the 2–3 requests/responses you're triaging at once.
- **Look good on a projector or Zoom share**, with a high-contrast dark theme designed for readability.

## Features

- 🌑 High-contrast dark theme optimized for screen sharing
- 📋 Smart paste — auto-unescapes double-escaped JSON and strips log-line prefixes
- 🗂 Multi-tab workspace with localStorage persistence
- 🔀 Side-by-side compare with clear diff highlights
- ⌨️ Keyboard shortcuts (`⌘T` / `Ctrl+T` for new tab, `⌘D` / `Ctrl+D` to toggle compare)
- 🚫 Zero ads, zero tracking, zero sign-up — everything runs locally in your browser

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS for the theme system
- Pure client-side — no backend, no data leaves your browser

## Running locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Building for production

```bash
npm run build
npm run preview
```

## Deployment

JSONPeek deploys as a static site to Vercel or Cloudflare Pages.

1. Push the repo to GitHub.
2. Import it into Vercel (or Cloudflare Pages).
3. Use the default build settings: `npm run build`, output directory `dist`.
4. Add your custom subdomain (e.g. `json.yourdomain.com`) in the project's Domains tab.
5. Point a CNAME record from your DNS provider to the deployment target.

## Roadmap

Small, focused scope. Contributions welcome for items on this list:

- [ ] Presentation mode (boost font, hide chrome)
- [ ] JSONPath search (`Cmd/Ctrl + F`)
- [ ] Table view for arrays of objects
- [ ] Command palette (`Cmd/Ctrl + K`)
- [ ] Copy JSONPath from any node (context menu)
- [ ] Light theme (opt-in)
- [ ] Import from URL (with optional CORS proxy)
- [ ] Semantic diff mode (ignore key ordering, treat arrays as sets)

## Contributing

PRs and issues welcome. Keep in mind the guiding principle: **if a feature would add more than a line of UI chrome, think twice.** JSONPeek exists to be uncluttered.

## License

MIT. See [LICENSE](LICENSE).

---

Built by [Abdul Mughni Alfikri](https://abdulmughnialfikri.com).
