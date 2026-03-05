# mdcat

**View markdown files beautifully in your terminal.**

[![npm version](https://img.shields.io/npm/v/mdcat.svg)](https://www.npmjs.com/package/mdcat)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

`mdcat` is a terminal pager for Markdown. It renders GitHub-Flavoured Markdown with full colour, syntax-highlighted code blocks, clickable hyperlinks (OSC 8), and a keyboard-driven TUI — all with zero configuration. Pipe a file into it or open one directly; it just works.

---

## What it looks like

- **H1** headings render in a purple Unicode box
- **H2** headings render in bold blue with an underline bar
- **H3–H6** headings use green → yellow → cyan → dim
- **Code blocks** get a bordered box with a language tag and syntax highlighting
- **Blockquotes** get an amber `▌` bar with dim italic text
- **Lists** use `●` / `○` / `‣` bullets; task lists use `☑` / `☐`
- **Tables** render with full Unicode box-drawing borders
- **Links** are blue and underlined, clickable in iTerm2 / Kitty / WezTerm

The top chrome bar shows the filename and file type. The bottom bar shows key hints and scroll percentage. Press `/` to search — matching lines get a gold `▶` gutter marker.

---

## Install

**Zero-install (recommended for one-off use):**

```sh
npx mdcat README.md
```

**Global install via npm:**

```sh
npm install -g mdcat
```

**macOS via Homebrew:**

```sh
brew install frankchan/tap/mdcat
```

---

## Usage

```sh
# Open a file
mdcat README.md

# Pipe from stdin
cat CHANGELOG.md | mdcat

# Read from curl
curl -s https://raw.githubusercontent.com/user/repo/main/README.md | mdcat

# Check version
mdcat --version

# Help
mdcat --help
```

---

## Keyboard shortcuts

| Key            | Action                          |
|----------------|---------------------------------|
| `q`            | Quit                            |
| `y`            | Copy visible page to clipboard  |
| `M`            | Toggle mouse (for text select)  |
| `j` / `k`      | Scroll down / up one line       |
| `↑` / `↓`      | Scroll up / down one line       |
| `Space` / `b`  | Page down / page up             |
| `d` / `u`      | Half-page down / up             |
| `g` / `G`      | Jump to top / bottom            |
| `/`            | Enter search mode               |
| `n` / `N`      | Next / previous search match    |
| `Esc`          | Cancel search or clear matches  |
| Mouse wheel    | Scroll up / down three lines    |

---

## Features

- Renders all GitHub-Flavoured Markdown (GFM) elements
- Syntax-highlighted code blocks via `cli-highlight` / highlight.js
- One Dark colour palette — easy on the eyes in dark terminals
- OSC 8 clickable hyperlinks (iTerm2, Kitty, WezTerm, foot, …)
- Full mouse wheel support
- Incremental search with `/` — highlights all matches, jumps to each
- Respects terminal width — long lines and tables are truncated cleanly
- Works with pipes: `curl … | mdcat`
- No configuration files, no dependencies to configure

---

## Supported Markdown

| Element          | Rendering                                      |
|------------------|------------------------------------------------|
| H1–H6 headings   | Coloured by level; H1 gets a Unicode box       |
| Paragraphs       | Word-wrapped to terminal width                 |
| **Bold**         | Bold white                                     |
| _Italic_         | Italic                                         |
| ~~Strikethrough~~| Strikethrough + dim                            |
| `inline code`    | Amber text on dark background                  |
| Fenced code      | Bordered box + syntax highlighting             |
| Blockquotes      | Amber `▌` bar with dim italic text             |
| Unordered lists  | `●` / `○` / `‣` bullets at increasing depth   |
| Ordered lists    | Cyan numbers                                   |
| Task lists       | `☑` / `☐` with green / dim colouring          |
| Tables           | Box-drawing borders; respects column alignment |
| Links            | Blue underline + OSC 8 clickable               |
| Images           | `🖼  alt-text` in dim                          |
| Horizontal rules | Full-width dim `─` line                        |
| HTML entities    | Decoded (`&amp;`, `&lt;`, `&gt;`, …)           |

---

## Contributing

Contributions are welcome! Please open an issue to discuss a feature or bug before sending a PR. The codebase is small and deliberately dependency-light — keep it that way.

```sh
git clone https://github.com/frankchan/mdcat
cd mdcat
npm install
npm test
```

Please make sure `npm test` passes before submitting.

---

## License

MIT — see [LICENSE](LICENSE) for details.
