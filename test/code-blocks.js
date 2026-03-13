import { test } from "node:test";
import assert from "node:assert/strict";
import { marked } from "marked";
import { renderTokens } from "../src/render.js";

marked.use({ gfm: true });

function strip(s) {
  return s
    .replace(/\x1B\]8;;.*?\x1B\\/gs, "")
    .replace(/\x1B\[[0-9;]*m/g, "");
}

function render(md, cols = 80) {
  return renderTokens(marked.lexer(md), cols);
}

function renderPlain(md, cols = 80) {
  return render(md, cols).map(strip).join("\n");
}

function vlen(s) {
  return strip(s).length;
}

// ─── Box width sizing ────────────────────────────────────────────────────────

test("code box width fits short content, not full terminal width", () => {
  const lines = render("```\nhi\n```", 80);
  // Find lines with │ border — they should be much narrower than 80 cols
  const contentLines = lines.filter(l => strip(l).includes("│"));
  for (const line of contentLines) {
    const w = vlen(line);
    assert.ok(w < 40, `Short code box line should be narrow, got width ${w}`);
  }
});

test("code box width grows for longer content", () => {
  const short = render("```\nhi\n```", 80);
  const long = render("```\n" + "x".repeat(50) + "\n```", 80);

  const shortW = Math.max(...short.filter(l => strip(l).includes("│")).map(l => vlen(l)));
  const longW = Math.max(...long.filter(l => strip(l).includes("│")).map(l => vlen(l)));

  assert.ok(longW > shortW, `Longer content (${longW}) should produce wider box than short (${shortW})`);
});

test("code box width caps at terminal width", () => {
  const lines = render("```\n" + "x".repeat(200) + "\n```", 60);
  for (const line of lines) {
    assert.ok(vlen(line) <= 60 + 5, `Code box should not exceed terminal width, got ${vlen(line)}`);
  }
});

test("code box with lang tag is at least as wide as lang tag", () => {
  const lines = render("```javascript\nx\n```", 80);
  const topBorder = lines.find(l => strip(l).includes("┌"));
  assert.ok(topBorder, "should have top border");
  assert.ok(strip(topBorder).includes("javascript"), "lang tag should appear in border");
});

test("code box top and bottom borders have same visual width", () => {
  const lines = render("```js\nconsole.log('hi');\n```", 80);
  const top = lines.find(l => strip(l).includes("┌"));
  const bot = lines.find(l => strip(l).includes("└"));
  assert.ok(top && bot, "should have top and bottom borders");
  assert.equal(vlen(top), vlen(bot), "top and bottom borders should have same width");
});

test("code box content lines have same visual width as borders", () => {
  const lines = render("```\nline one\nshort\na longer line here\n```", 80);
  const bordered = lines.filter(l => strip(l).match(/[┌└│]/));
  if (bordered.length > 2) {
    const borderW = vlen(bordered[0]);
    for (const line of bordered) {
      assert.equal(vlen(line), borderW, `All bordered lines should be same width, expected ${borderW} got ${vlen(line)}`);
    }
  }
});

// ─── Multi-line content ──────────────────────────────────────────────────────

test("code box sizes to longest line, not shortest", () => {
  const md = "```\nshort\nthis is a much longer line of code\nx\n```";
  const lines = render(md, 80);
  const contentLines = lines.filter(l => strip(l).includes("│") && !strip(l).includes("┌") && !strip(l).includes("└"));
  // All content lines should have the same width (padded to longest)
  const widths = contentLines.map(l => vlen(l));
  const unique = [...new Set(widths)];
  assert.equal(unique.length, 1, `All content lines should be same width, got: ${widths}`);
});

test("code box minimum width is at least 4 chars inner", () => {
  const lines = render("```\n\n```", 80);
  const contentLines = lines.filter(l => strip(l).includes("│"));
  for (const line of contentLines) {
    // 2 margin + 1 │ + 1 space + 4 inner + 1 space + 1 │ = 10 minimum
    assert.ok(vlen(line) >= 10, `Code box should have minimum inner width, got ${vlen(line)}`);
  }
});

// ─── Syntax highlighting ─────────────────────────────────────────────────────

test("code block with valid language contains ANSI sequences", () => {
  const lines = render("```js\nconst x = 42;\n```", 80);
  const hasAnsi = lines.some(l => l.includes("\x1B["));
  assert.ok(hasAnsi, "highlighted code should contain ANSI escape sequences");
});

test("code block with unknown language still renders", () => {
  const plain = renderPlain("```xyzfakelang\nsome code\n```");
  assert.ok(plain.includes("some code"));
});

test("code block with tabs expands to spaces", () => {
  const plain = renderPlain("```\n\tindented\n```");
  assert.ok(!plain.includes("\t"), "tabs should be expanded");
  assert.ok(plain.includes("indented"));
});
