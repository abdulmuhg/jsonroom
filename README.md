# JSONRoom

> *"Is this the Jason room?"*
> *"Close — but this is the **JSON** Room."*

A quiet, ad-free room for your JSON. A viewer, formatter, and side-by-side diff tool built for debugging API responses with your team — especially when you're sharing your screen.

Live at **[json.abdulmughnialfikri.com](https://json.abdulmughnialfikri.com)**.

## Why this exists

Most online JSON tools are loud — ads, upsells, "sign in to save" nags, and ten features you never use. JSONRoom is the opposite. It's a small, focused tool that does four things very well:

- **Paste messy JSON** from anywhere (Grafana log lines, escaped strings, quoted responses) and see it cleanly formatted
- **Compare two payloads** side-by-side with clear highlights of added, removed, and changed keys
- **Work with multiple tabs** for the 2–3 requests you're triaging at once
- **Look good on a projector or Zoom share**, with a high-contrast dark theme designed for readability

## Meet Mr. J

JSONRoom is hosted by **Mr. J** — a polite fellow who opens the door when you arrive. First-time visitors get a brief JRPG-style intro; regulars never see it again. You can also replay the intro anytime from the header, or link directly with `?intro=1`.

## Features

- 🚪 A warm welcome on first visit (skippable, shown once)
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

JSONRoom deploys as a static site to Vercel or Cloudflare Pages.

1. Push the repo to GitHub
2. Import it into Vercel (or Cloudflare Pages)
3. Use the default build settings: `npm run build`, output directory `dist`
4. Add your custom subdomain (e.g. `json.yourdomain.com`) in the project's Domains tab
5. Point a CNAME record from your DNS provider to the deployment target

## Roadmap

Small, focused scope. Contributions welcome:

- [ ] Presentation mode (boost font, hide chrome)
- [ ] JSONPath search (`Cmd/Ctrl + F`)
- [ ] Table view for arrays of objects
- [ ] Command palette (`Cmd/Ctrl + K`)
- [ ] Copy JSONPath from any node (context menu)
- [ ] Light theme (opt-in)
- [ ] Import from URL (with optional CORS proxy)
- [ ] Semantic diff mode (ignore key ordering, treat arrays as sets)

## Contributing

PRs and issues welcome. Guiding principle: **if a feature would add more than a line of UI chrome, think twice.** JSONRoom exists to be uncluttered.

## License

MIT. See [LICENSE](LICENSE).

---

Built with care by [Abdul Mughni Alfikri](https://abdulmughnialfikri.com). If JSONRoom is useful to you, a ⭐ on this repo goes a long way.
