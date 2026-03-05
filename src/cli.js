#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, basename } from "path";
import { marked } from "marked";
import { renderTokens } from "./render.js";
import { launch } from "./tui.js";

marked.use({ gfm: true });

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const E = "\x1B";
const dim    = s => `${E}[2m${s}${E}[0m`;
const blue   = s => `${E}[38;2;97;175;239m${s}${E}[0m`;
const purple = s => `${E}[38;2;198;120;221m${s}${E}[0m`;
const gray   = s => `${E}[38;2;92;99;112m${s}${E}[0m`;
const bold   = s => `${E}[1m${s}${E}[0m`;

const CAT = [
  `  ${gray("/\\_/\\")}  `,
  ` ${gray("(")} ${blue("o")}${gray(".")}${blue("o")} ${gray(")")} `,
  ` ${gray("=(")} ${purple("^")} ${gray(")=")} `,
].join("\n");

const args = process.argv.slice(2);

if (args[0] === "--help" || args[0] === "-h") {
  console.log(`\n${CAT}  ${bold("mdcat")} ${dim(`v${pkg.version}`)}`);
  console.log(`${dim("         markdown pager for your terminal")}\n`);
  console.log(`${bold("Usage:")}`);
  console.log(`  mdcat ${dim("<file.md>")}`);
  console.log(`  cat file.md ${dim("|")} mdcat\n`);
  console.log(`${bold("Keys:")}`);
  console.log(`  ${blue("/")}          search          ${blue("n/N")}   next/prev match`);
  console.log(`  ${blue("j/k")} ${dim("↑↓")}    scroll line     ${blue("space/b")} page down/up`);
  console.log(`  ${blue("d/u")}        half page       ${blue("g/G")}   top/bottom`);
  console.log(`  ${blue("q")}          quit\n`);
  process.exit(0);
}

if (args[0] === "--version" || args[0] === "-v") {
  console.log(`${CAT}  ${bold("mdcat")} ${dim(`v${pkg.version}`)}`);
  process.exit(0);
}

const MAX_COLS = 100; // browser-like reading width cap

function run(title, content) {
  const cols = Math.min(process.stdout.columns || 80, MAX_COLS);
  const tokens = marked.lexer(content);
  const lines = renderTokens(tokens, cols);
  launch(title, lines);
}

// Piped input: cat file.md | mdcat
if (!process.stdin.isTTY && args.length === 0) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => run("stdin", input));
} else if (args.length === 0) {
  console.error("Usage: mdcat <file.md>");
  process.exit(1);
} else {
  const filePath = resolve(args[0]);
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`mdcat: ${args[0]}: ${err.code === "ENOENT" ? "No such file" : err.message}`);
    process.exit(1);
  }
  run(basename(filePath), content);
}
