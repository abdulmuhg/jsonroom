# Contributing to JSONRoom

Thanks for helping out. JSONRoom is small on purpose, so the best contributions are focused ones.

## Getting started

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Before you open a PR

```bash
npm test
npm run build
```

CI runs both on every pull request.

## Finding something to work on

- Issues labelled [`good first issue`](https://github.com/abdulmuhg/jsonroom/labels/good%20first%20issue) are a good place to start.
- For anything bigger, open an issue or comment on an existing one first so we can agree on the approach before you write code.

## Guidelines

- **Keep the UI quiet.** If a feature adds more than a line of UI chrome, think twice.
- **Everything stays in the browser.** No backend, no tracking, no data leaving the page.
- **Add tests** for logic in `src/lib` and `src/hooks` (Vitest, files next to the code as `*.test.ts`).
- **One change per PR**, with a [Conventional Commits](https://www.conventionalcommits.org/) style title: `feat:`, `fix:`, `docs:`, `chore:`.

## Reporting bugs

Use the bug report template, and include the smallest JSON sample that reproduces the problem. Strip anything sensitive first.
