#!/usr/bin/env node
import { readFileSync } from "fs";
import { resolve, basename } from "path";
import { marked } from "marked";
import { renderTokens } from "./render.js";
import { launch } from "./tui.js";

marked.use({ gfm: true });

const args = process.argv.slice(2);

if (args[0] === "--help" || args[0] === "-h") {
  console.log("Usage: mdcat <file.md>");
  console.log("       cat file.md | mdcat");
  console.log("\nKeys: q quit  j/k or ↑↓ scroll  space/b page  d/u half-page  g/G top/bottom");
  process.exit(0);
}

if (args[0] === "--version" || args[0] === "-v") {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  console.log(pkg.version);
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
