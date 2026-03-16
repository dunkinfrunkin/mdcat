#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve, basename } from "path";
import { tmpdir } from "os";
import { execFileSync } from "child_process";
import { marked, Marked } from "marked";
import { renderTokens, setTheme } from "./render.js";
import { launch } from "./tui.js";
import { toDocx } from "./docx.js";
import { detectTheme, themeFromArgs, stripThemeArgs } from "./theme.js";
import { concatFiles } from "./concat.js";
import { getDiffMap, mapDiffToRendered } from "./git.js";

marked.use({ gfm: true });

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const E = "\x1B";
const dim  = s => `${E}[2m${s}${E}[0m`;
const blue = s => `${E}[38;2;97;175;239m${s}${E}[0m`;
const gray = s => `${E}[38;2;92;99;112m${s}${E}[0m`;
const bold = s => `${E}[1m${s}${E}[0m`;

const CAT = `  ${gray("/\\")}${blue("(o.o)")}${gray("/\\")}  `;

let args = process.argv.slice(2);

if (args[0] === "--help" || args[0] === "-h") {
  console.log(`\n${CAT}  ${bold("mdcat")} ${dim(`v${pkg.version}`)}`);
  console.log(`${dim("         markdown pager for your terminal")}\n`);
  console.log(`${bold("Usage:")}`);
  console.log(`  mdcat ${dim("<file.md> [file2.md ...]")}`);
  console.log(`  mdcat ${dim("--web <file.md>")}   ${dim("# open in browser")}`);
  console.log(`  mdcat ${dim("--doc <file.md>")}   ${dim("# export to .docx")}`);
  console.log(`  mdcat ${dim("-p, --plain")}       ${dim("# plain output (no TUI, no ANSI)")}`);
  console.log(`  mdcat ${dim("--light")}           ${dim("# force light theme")}`);
  console.log(`  mdcat ${dim("--dark")}            ${dim("# force dark theme")}`);
  console.log(`  mdcat ${dim("-n, --number")}      ${dim("# show line numbers")}`);
  console.log(`  cat file.md ${dim("|")} mdcat\n`);
  console.log(`${bold("Theme:")}`);
  console.log(`  Auto-detects terminal theme. Override with ${blue("--light")} / ${blue("--dark")}`);
  console.log(`  or set ${blue("MDCAT_THEME")}=light|dark\n`);
  console.log(`${bold("Keys:")}`);
  console.log(`  ${blue("/")}          search          ${blue("n/N")}   next/prev match`);
  console.log(`  ${blue("j/k")} ${dim("↑↓")}    scroll line     ${blue("space/b")} page down/up`);
  console.log(`  ${blue("d/u")}        half page       ${blue("g/G")}   top/bottom`);
  console.log(`  ${blue("L")}          line numbers    ${blue("q")}     quit\n`);
  process.exit(0);
}

// Resolve theme: CLI flag > env var > auto-detect
const activeTheme = themeFromArgs(args) ?? detectTheme();
args = stripThemeArgs(args);
setTheme(activeTheme);

// Plain mode flag
const plainMode = args.includes("-p") || args.includes("--plain");
args = args.filter(a => a !== "-p" && a !== "--plain");

// Line numbers flag
const showLineNumbers = args.includes("-n") || args.includes("--number");
args = args.filter(a => a !== "-n" && a !== "--number");

if (args[0] === "--version" || args[0] === "-v") {
  console.log(`${CAT}  ${bold("mdcat")} ${dim(`v${pkg.version}`)}`);
  process.exit(0);
}

const MAX_COLS = 100;

/** Strip ANSI SGR sequences and OSC 8 hyperlinks for plain text output. */
function stripAnsi(s) {
  return s
    .replace(/\x1B\]8;;.*?\x1B\\/gs, "")
    .replace(/\x1B\[[0-9;]*m/g, "");
}

function runPlain(content) {
  const cols = Math.min(process.stdout.columns || 80, MAX_COLS);
  const tokens = marked.lexer(content);
  const lines = renderTokens(tokens, cols);
  for (const line of lines) {
    console.log(stripAnsi(line));
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function openInBrowser(title, content) {
  // Use a custom renderer that escapes raw HTML tokens so bare <tag> in
  // markdown text isn't swallowed by the browser.
  const webMarked = new Marked({ gfm: true });
  webMarked.use({
    renderer: {
      html(token) {
        return escapeHtml(token.text);
      },
    },
  });
  const html = webMarked.parse(content);
  const isLight = activeTheme === "light";
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${isLight ? "#fafafa" : "#282c34"};
      color: ${isLight ? "#383a42" : "#abb2bf"};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 16px;
      line-height: 1.7;
      padding: 2rem 1rem;
    }
    .wrap { max-width: 760px; margin: 0 auto; }
    h1, h2, h3, h4, h5, h6 { color: ${isLight ? "#c18401" : "#e5c07b"}; margin: 1.5rem 0 0.5rem; font-weight: 700; }
    h1 { font-size: 2rem; color: ${isLight ? "#a626a4" : "#c678dd"}; border-bottom: 2px solid ${isLight ? "#d3d3d8" : "#3e4451"}; padding-bottom: 0.4rem; }
    h2 { font-size: 1.4rem; color: ${isLight ? "#4078f2" : "#61afef"}; border-bottom: 1px solid ${isLight ? "#d3d3d8" : "#3e4451"}; padding-bottom: 0.3rem; }
    h3 { font-size: 1.15rem; color: ${isLight ? "#50a14f" : "#98c379"}; }
    p { margin: 0.75rem 0; }
    a { color: ${isLight ? "#4078f2" : "#61afef"}; text-decoration: underline; }
    code { background: ${isLight ? "#e8e8e8" : "#2c313a"}; color: ${isLight ? "#986801" : "#e5c07b"}; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
    pre { background: ${isLight ? "#f0f0f0" : "#21252b"}; border: 1px solid ${isLight ? "#d3d3d8" : "#3e4451"}; border-radius: 8px; padding: 1rem 1.25rem; overflow-x: auto; margin: 1rem 0; }
    pre code { background: none; color: ${isLight ? "#383a42" : "#abb2bf"}; padding: 0; font-size: 0.875rem; }
    blockquote { border-left: 3px solid ${isLight ? "#c18401" : "#e5c07b"}; padding: 0.5rem 1rem; margin: 1rem 0; color: ${isLight ? "#696c77" : "#5c6370"}; font-style: italic; }
    ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
    li { margin: 0.25rem 0; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th { background: ${isLight ? "#e8e8e8" : "#21252b"}; color: ${isLight ? "#4078f2" : "#61afef"}; padding: 0.5rem 0.75rem; border: 1px solid ${isLight ? "#d3d3d8" : "#3e4451"}; text-align: left; }
    td { padding: 0.5rem 0.75rem; border: 1px solid ${isLight ? "#d3d3d8" : "#3e4451"}; }
    tr:nth-child(even) { background: ${isLight ? "#f0f0f0" : "#2c313a"}; }
    hr { border: none; border-top: 1px solid ${isLight ? "#d3d3d8" : "#3e4451"}; margin: 1.5rem 0; }
    img { max-width: 100%; border-radius: 6px; }
  </style>
</head>
<body><div class="wrap">${html}</div></body>
</html>`;

  const tmp = `${tmpdir()}/mdcat-${Date.now()}.html`;
  writeFileSync(tmp, page);

  const opener = process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "start"
    : "xdg-open";
  try { execFileSync(opener, [tmp]); }
  catch { console.error(`mdcat: could not open browser`); process.exit(1); }
}

function runTUI(title, content, filePath) {
  const termCols = process.stdout.columns || 80;
  const cols = Math.min(termCols, MAX_COLS);
  const tokens = marked.lexer(content);
  const lines = renderTokens(tokens, cols, termCols > MAX_COLS ? termCols : undefined);

  let diffMap = new Map();
  if (filePath) {
    const sourceLineCount = content.split("\n").length;
    const sourceDiffMap = getDiffMap(filePath, sourceLineCount);
    diffMap = mapDiffToRendered(sourceDiffMap, sourceLineCount, lines.length);
  }

  launch(title, lines, activeTheme, { lineNumbers: showLineNumbers, diffMap });
}

// --web / --doc flags
const webMode = args[0] === "--web" || args[0] === "-w";
const docMode = args[0] === "--doc" || args[0] === "-d";
const fileArgs = (webMode || docMode) ? args.slice(1) : args;

async function exportDocx(title, content) {
  const tokens = marked.lexer(content);
  const buf = await toDocx(tokens, title);
  const outName = title.replace(/\.md$/i, "") + ".docx";
  const outPath = resolve(outName);
  writeFileSync(outPath, buf);
  console.log(`${CAT}  ${bold("mdcat")} ${dim("→")} ${blue(outPath)}`);
}

// Piped input
if (!process.stdin.isTTY && fileArgs.length === 0) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    if (docMode) exportDocx("stdin", input);
    else if (webMode) openInBrowser("stdin", input);
    else if (plainMode) runPlain(input);
    else runTUI("stdin", input);
  });
} else if (fileArgs.length === 0) {
  console.error("Usage: mdcat <file.md> [file2.md ...]");
  process.exit(1);
} else {
  const parts = [];
  for (const arg of fileArgs) {
    const filePath = resolve(arg);
    let text;
    try {
      text = readFileSync(filePath, "utf8");
    } catch (err) {
      console.error(`mdcat: ${arg}: ${err.code === "ENOENT" ? "No such file" : err.message}`);
      process.exit(1);
    }
    parts.push({ name: basename(filePath), content: text });
  }

  const { title, content } = concatFiles(parts);

  if (docMode) exportDocx(title, content);
  else if (webMode) openInBrowser(title, content);
  else if (plainMode) runPlain(content);
  else runTUI(title, content, filePath);
}
