# Contributing to mdcat

Thanks for your interest! Contributions are welcome — bug fixes, features, and docs alike.

## Before you start

Open an issue first for any significant change so we can discuss the approach. Small bug fixes can go straight to a PR.

## Setup

```sh
git clone https://github.com/dunkinfrunkin/mdcat
cd mdcat
npm install
```

## Running tests

```sh
npm test
```

All 95 tests must pass before submitting. If you add a feature, add a test for it in `test/index.js`.

## Project structure

```
src/
  cli.js      — entry point, arg parsing, --web/--light/--dark flags
  render.js   — markdown tokens → ANSI-coloured string[]
  tui.js      — raw terminal TUI (alternate screen, input, draw loop)
  theme.js    — light/dark theme detection and CLI flag helpers
  git.js      — git diff parsing and gutter marker generation
test/
  index.js    — node:test suite (95 tests)
web/
  src/        — Docusaurus landing page (mdcat.frankchan.dev)
```

## Guidelines

- Keep it dependency-light — think twice before adding a new package
- `render.js` and `tui.js` use raw ANSI escape codes, no terminal libraries
- All rendering helpers (`vlen`, `vtrunc`, `vpad`) must be ANSI-aware
- Match the One Dark / One Light colour palettes for any new visual elements (see `render.js` `darkPalette()` and `lightPalette()`)

## Commit style

Plain English imperative: `Fix table border overflow on narrow terminals`

## License

By contributing you agree your code will be released under the [MIT License](LICENSE).
