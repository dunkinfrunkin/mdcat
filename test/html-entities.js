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

function renderPlain(md, cols = 80) {
  return renderTokens(marked.lexer(md), cols).map(strip).join("\n");
}

// ─── Named entities ──────────────────────────────────────────────────────────

test("entity: &amp; decodes to &", () => {
  assert.ok(renderPlain("A &amp; B").includes("A & B"));
});

test("entity: &lt; decodes to <", () => {
  assert.ok(renderPlain("&lt;div&gt;").includes("<div>"));
});

test("entity: &gt; decodes to >", () => {
  assert.ok(renderPlain("a &gt; b").includes("a > b"));
});

test("entity: &quot; decodes to double quote", () => {
  assert.ok(renderPlain("&quot;hello&quot;").includes('"hello"'));
});

test("entity: &#39; decodes to single quote", () => {
  assert.ok(renderPlain("it&#39;s").includes("it's"));
});

test("entity: &nbsp; decodes to space", () => {
  const plain = renderPlain("hello&nbsp;world");
  assert.ok(plain.includes("hello world"));
});

// ─── Numeric entities ────────────────────────────────────────────────────────

test("entity: &#169; decodes to copyright symbol", () => {
  assert.ok(renderPlain("&#169;").includes("©"));
});

test("entity: &#8226; decodes to bullet", () => {
  assert.ok(renderPlain("&#8226;").includes("•"));
});

test("entity: &#60; decodes to <", () => {
  assert.ok(renderPlain("&#60;tag&#62;").includes("<tag>"));
});

// ─── Hex entities ────────────────────────────────────────────────────────────

test("entity: &#x00A9; decodes to copyright symbol", () => {
  assert.ok(renderPlain("&#x00A9;").includes("©"));
});

test("entity: &#x2665; decodes to heart", () => {
  assert.ok(renderPlain("&#x2665;").includes("♥"));
});

test("entity: &#x3C; decodes to <", () => {
  assert.ok(renderPlain("&#x3C;div&#x3E;").includes("<div>"));
});

test("entity: &#x26; decodes to &", () => {
  assert.ok(renderPlain("&#x26;").includes("&"));
});

// ─── Entities in different contexts ──────────────────────────────────────────

test("entity: decoded in heading text", () => {
  const plain = renderPlain("## A &amp; B");
  assert.ok(plain.includes("A & B"));
});

test("entity: decoded in list item", () => {
  const plain = renderPlain("- item &lt;1&gt;");
  assert.ok(plain.includes("item <1>"));
});

test("entity: decoded in blockquote", () => {
  const plain = renderPlain("> &quot;quoted&quot;");
  assert.ok(plain.includes('"quoted"'));
});

test("entity: decoded in bold text", () => {
  const plain = renderPlain("**&amp;bold**");
  assert.ok(plain.includes("&bold"));
});

test("entity: multiple entities in one line", () => {
  const plain = renderPlain("&lt;div class=&quot;foo&quot;&gt;");
  assert.ok(plain.includes('<div class="foo">'));
});
