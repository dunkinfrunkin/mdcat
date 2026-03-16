# mdcat /\(o.o)/\

[![npm](https://img.shields.io/npm/v/@dunkinfrunkin/mdcat?color=61afef&label=npm)](https://www.npmjs.com/package/@dunkinfrunkin/mdcat)
[![license](https://img.shields.io/badge/license-MIT-98c379)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-e5c07b)](package.json)
[![CI](https://github.com/dunkinfrunkin/mdcat/actions/workflows/ci.yml/badge.svg)](https://github.com/dunkinfrunkin/mdcat/actions/workflows/ci.yml)
[![site](https://img.shields.io/badge/site-mdcat.frankchan.dev-61afef)](https://mdcat.frankchan.dev)

**Terminal pager for Markdown.** Full colour, syntax highlighting, incremental search, mouse support — zero config.

```sh
npm install -g @dunkinfrunkin/mdcat
```

![mdcat demo](https://github.com/dunkinfrunkin/mdcat/releases/download/v0.1.12/demo.gif)

---

## Install

```sh
# npm (global)
npm install -g @dunkinfrunkin/mdcat

# Homebrew
brew install dunkinfrunkin/tap/mdcat

# Zero-install
npx @dunkinfrunkin/mdcat README.md
```

## Usage

```sh
mdcat README.md                  # open a file
mdcat --web README.md            # render and open in browser
mdcat -p README.md               # plain text output (no TUI, no ANSI)
mdcat -n README.md               # show line numbers
mdcat --light README.md          # force light theme
mdcat --dark README.md           # force dark theme
cat CHANGELOG.md | mdcat         # pipe from stdin
curl -s https://… | mdcat        # pipe from curl
mdcat --help                     # show help
mdcat --version                  # show version
```

## Keys

| Key | Action |
|-----|--------|
| `q` | Quit |
| `y` | Copy visible page to clipboard |
| `L` | Toggle line numbers |
| `M` | Toggle mouse (off = free text selection) |
| `j` / `k` | Scroll down / up |
| `Space` / `b` | Page down / up |
| `d` / `u` | Half-page down / up |
| `g` / `G` | Top / bottom |
| `/` | Search |
| `n` / `N` | Next / previous match |
| `Esc` | Clear search |
| Mouse wheel | Scroll three lines |

## Theme

mdcat auto-detects your terminal's light or dark background and adjusts colors accordingly.

**Auto-detection** checks (in order):
1. `MDCAT_THEME` env var (`light` or `dark`)
2. `COLORFGBG` env var (set by many terminals)
3. macOS system appearance (light/dark mode)
4. Falls back to dark

**Override manually:**
```sh
mdcat --light README.md          # force light theme
mdcat --dark README.md           # force dark theme
MDCAT_THEME=light mdcat file.md  # env var override
```

## What it renders

| Element | Rendering |
|---------|-----------|
| H1 | Purple Unicode box |
| H2 | Bold blue with underline |
| H3–H6 | Green → yellow → cyan → dim |
| **Bold** / _italic_ / ~~strike~~ | Standard ANSI |
| `inline code` | Amber on dark bg / brown on light bg |
| Fenced code | Bordered box with syntax highlighting |
| Blockquotes | Amber `▌` bar, dim italic |
| Unordered lists | `●` / `○` / `‣` bullets |
| Ordered lists | Cyan numbers |
| Task lists | `☑` / `☐` with green / dim |
| Tables | Box-drawing borders, column alignment |
| Links | Blue underline, OSC 8 clickable |
| Images | `[alt text]` badge in dim |
| Horizontal rules | Full-width dim `─` line |
| HTML entities | Decoded (`&amp;`, `&lt;`, …) |

## Contributing

Bug reports and pull requests are welcome. Please open an issue first to discuss significant changes.

```sh
git clone https://github.com/dunkinfrunkin/mdcat
cd mdcat
npm install
npm test
```

All PRs must pass `npm test` (90 tests).

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## Links

- [mdcat.frankchan.dev](https://mdcat.frankchan.dev) -- landing page
- [npm package](https://www.npmjs.com/package/@dunkinfrunkin/mdcat)
- [GitHub](https://github.com/dunkinfrunkin/mdcat)

## License

[MIT](LICENSE) © Frank Chan
