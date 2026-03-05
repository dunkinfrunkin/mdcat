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
mdcat README.md
cat CHANGELOG.md | mdcat
curl -s https://raw.githubusercontent.com/user/repo/main/README.md | mdcat
```

## Keys

| Key            | Action                          |
|----------------|---------------------------------|
| `q`            | Quit                            |
| `y`            | Copy visible page to clipboard  |
| `M`            | Toggle mouse (for text select)  |
| `j` / `k`      | Scroll down / up                |
| `Space` / `b`  | Page down / up                  |
| `d` / `u`      | Half-page down / up             |
| `g` / `G`      | Top / bottom                    |
| `/`            | Search                          |
| `n` / `N`      | Next / previous match           |
| `Esc`          | Clear search                    |
| Mouse wheel    | Scroll three lines              |

## Contributing

```sh
git clone https://github.com/dunkinfrunkin/mdcat
cd mdcat && npm install && npm test
```

## License

MIT
