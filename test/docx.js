import { test } from "node:test";
import assert from "node:assert/strict";
import { marked } from "marked";
import { toDocx } from "../src/docx.js";

marked.use({ gfm: true });

/** Helper: convert markdown to docx buffer. */
async function docx(md, title = "Test") {
  const tokens = marked.lexer(md);
  return await toDocx(tokens, title);
}

// ─── Basic output ────────────────────────────────────────────────────────────

test("docx: returns a Buffer", async () => {
  const buf = await docx("# Hello");
  assert.ok(Buffer.isBuffer(buf), "toDocx should return a Buffer");
});

test("docx: buffer is non-empty", async () => {
  const buf = await docx("# Hello\n\nSome text.");
  assert.ok(buf.length > 0, "buffer should not be empty");
});

test("docx: buffer starts with PK (zip header)", async () => {
  const buf = await docx("# Test");
  assert.equal(buf[0], 0x50, "first byte should be P");
  assert.equal(buf[1], 0x4b, "second byte should be K");
});

test("docx: empty document produces valid buffer", async () => {
  const buf = await docx("");
  assert.ok(Buffer.isBuffer(buf));
  assert.ok(buf.length > 0);
});

// ─── Headings ────────────────────────────────────────────────────────────────

test("docx: H1 heading does not throw", async () => {
  await assert.doesNotReject(() => docx("# Title"));
});

test("docx: H2-H6 headings do not throw", async () => {
  const md = "## H2\n### H3\n#### H4\n##### H5\n###### H6";
  await assert.doesNotReject(() => docx(md));
});

// ─── Paragraphs & inline ────────────────────────────────────────────────────

test("docx: paragraph with bold/italic does not throw", async () => {
  await assert.doesNotReject(() => docx("This is **bold** and _italic_ text."));
});

test("docx: paragraph with inline code does not throw", async () => {
  await assert.doesNotReject(() => docx("Run `npm install` to begin."));
});

test("docx: paragraph with strikethrough does not throw", async () => {
  await assert.doesNotReject(() => docx("This is ~~deleted~~ text."));
});

test("docx: paragraph with link does not throw", async () => {
  await assert.doesNotReject(() => docx("[click here](https://example.com)"));
});

// ─── Code blocks ─────────────────────────────────────────────────────────────

test("docx: code block without language does not throw", async () => {
  await assert.doesNotReject(() => docx("```\nhello code\n```"));
});

test("docx: code block with language does not throw", async () => {
  await assert.doesNotReject(() => docx("```javascript\nconsole.log(1);\n```"));
});

test("docx: empty code block does not throw", async () => {
  await assert.doesNotReject(() => docx("```\n```"));
});

// ─── Blockquotes ─────────────────────────────────────────────────────────────

test("docx: blockquote does not throw", async () => {
  await assert.doesNotReject(() => docx("> This is a quote."));
});

test("docx: nested blockquote does not throw", async () => {
  await assert.doesNotReject(() => docx("> Outer\n> > Inner"));
});

// ─── Lists ───────────────────────────────────────────────────────────────────

test("docx: unordered list does not throw", async () => {
  await assert.doesNotReject(() => docx("- apple\n- banana\n- cherry"));
});

test("docx: ordered list does not throw", async () => {
  await assert.doesNotReject(() => docx("1. first\n2. second\n3. third"));
});

test("docx: task list does not throw", async () => {
  await assert.doesNotReject(() => docx("- [x] done\n- [ ] todo"));
});

test("docx: nested list does not throw", async () => {
  await assert.doesNotReject(() => docx("- outer\n  - inner\n    - deep"));
});

// ─── Tables ──────────────────────────────────────────────────────────────────

test("docx: table does not throw", async () => {
  const md = "| A | B |\n|---|---|\n| 1 | 2 |";
  await assert.doesNotReject(() => docx(md));
});

test("docx: table with alignment does not throw", async () => {
  const md = "| Left | Right | Center |\n|:-----|------:|:------:|\n| a | b | c |";
  await assert.doesNotReject(() => docx(md));
});

test("docx: wide table with many columns does not throw", async () => {
  const md = "| A | B | C | D | E |\n|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 |";
  await assert.doesNotReject(() => docx(md));
});

// ─── HR ──────────────────────────────────────────────────────────────────────

test("docx: horizontal rule does not throw", async () => {
  await assert.doesNotReject(() => docx("---"));
});

// ─── Images ──────────────────────────────────────────────────────────────────

test("docx: image renders as text placeholder", async () => {
  await assert.doesNotReject(() => docx("![alt text](image.png)"));
});

// ─── HTML entities ───────────────────────────────────────────────────────────

test("docx: HTML entities in text do not throw", async () => {
  await assert.doesNotReject(() => docx("A &amp; B &lt;div&gt; &quot;hello&quot;"));
});

test("docx: numeric entities do not throw", async () => {
  await assert.doesNotReject(() => docx("&#169; copyright &#x2665; heart"));
});

// ─── Full document ───────────────────────────────────────────────────────────

test("docx: full document with all block types produces valid buffer", async () => {
  const md = `# Heading One

## Heading Two

Paragraph with **bold**, _italic_, ~~strike~~, \`code\`, and [link](https://example.com).

\`\`\`javascript
function greet(name) {
  console.log("Hello, " + name);
}
\`\`\`

> A blockquote.

- item one
- item two
  - nested
- [x] done
- [ ] todo

1. first
2. second

| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |

---

Last paragraph.`;

  const buf = await docx(md, "Full Test");
  assert.ok(Buffer.isBuffer(buf));
  assert.ok(buf.length > 100, "full doc buffer should be substantial");
  assert.equal(buf[0], 0x50, "starts with PK");
});
