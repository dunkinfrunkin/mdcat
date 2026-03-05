# mdcat /\(o.o)/\

[![npm](https://img.shields.io/npm/v/@dunkinfrunkin/mdcat?color=61afef&label=npm)](https://www.npmjs.com/package/@dunkinfrunkin/mdcat)
[![license](https://img.shields.io/badge/license-MIT-98c379)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-e5c07b)](package.json)

**Terminal pager for Markdown.** Full colour, syntax highlighting, incremental search, mouse support — zero config.

```sh
npx @dunkinfrunkin/mdcat README.md
```

---

## Install

```sh
# Zero-install
npx @dunkinfrunkin/mdcat README.md

# Global
npm install -g @dunkinfrunkin/mdcat

# Homebrew
brew install frankchan/tap/mdcat
```

## Usage

```sh
mdcat README.md                  # open a file
mdcat --web README.md            # render and open in browser
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
| `M` | Toggle mouse (off = free text selection) |
| `j` / `k` | Scroll down / up |
| `Space` / `b` | Page down / up |
| `d` / `u` | Half-page down / up |
| `g` / `G` | Top / bottom |
| `/` | Search |
| `n` / `N` | Next / previous match |
| `Esc` | Clear search |
| Mouse wheel | Scroll three lines |

## What it renders

| Element | Rendering |
|---------|-----------|
| H1 | Purple Unicode box |
| H2 | Bold blue with underline |
| H3–H6 | Green → yellow → cyan → dim |
| **Bold** / _italic_ / ~~strike~~ | Standard ANSI |
| `inline code` | Amber on dark background |
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

All PRs must pass `npm test` (68 tests).

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

[MIT](LICENSE) © Frank Chan
