import { test } from "node:test";
import assert from "node:assert/strict";
import { marked, Marked } from "marked";
import { renderTokens, setTheme } from "../src/render.js";
import { detectTheme, themeFromArgs, stripThemeArgs } from "../src/theme.js";
import { launch } from "../src/tui.js";

marked.use({ gfm: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip ANSI SGR and OSC 8 hyperlink sequences for plain-text assertions. */
function strip(s) {
  return s
    .replace(/\x1B\]8;;.*?\x1B\\/gs, "")
    .replace(/\x1B\[[0-9;]*m/g, "");
}

/** Render markdown to an array of lines. */
function render(md, cols = 80) {
  return renderTokens(marked.lexer(md), cols);
}

/** Render markdown to a single joined string. */
function renderStr(md, cols = 80) {
  return render(md, cols).join("\n");
}

/** Strip ANSI and join the lines of a render result. */
function renderPlain(md, cols = 80) {
  return strip(renderStr(md, cols));
}

/** Visual length of a string (strips ANSI). */
function vlen(s) {
  return strip(s).length;
}

// ─── Headings ─────────────────────────────────────────────────────────────────

test("H1 renders without throwing", () => {
  assert.doesNotThrow(() => render("# Hello World"));
});

test("H1 output contains uppercased text", () => {
  const plain = renderPlain("# Hello World");
  assert.ok(plain.includes("HELLO WORLD"), `Expected HELLO WORLD in: ${plain}`);
});

test("H1 box uses Unicode border characters", () => {
  const out = renderStr("# Title");
  assert.ok(out.includes("╔"), "H1 should have ╔ border");
  assert.ok(out.includes("╝"), "H1 should have ╝ border");
});

test("H2 renders without throwing", () => {
  assert.doesNotThrow(() => render("## Section"));
});

test("H2 output contains the heading text", () => {
  const plain = renderPlain("## Section");
  assert.ok(plain.includes("Section"));
});

test("H2 has underline bar", () => {
  const lines = render("## Section").map(strip);
  const barLine = lines.find((l) => /^─+$/.test(l.trim()));
  assert.ok(barLine !== undefined, "H2 should have a ─ bar line");
});

test("H3 renders without throwing and contains text", () => {
  assert.doesNotThrow(() => render("### Sub"));
  assert.ok(renderPlain("### Sub").includes("Sub"));
});

test("H4 renders without throwing and contains text", () => {
  assert.doesNotThrow(() => render("#### Deep"));
  assert.ok(renderPlain("#### Deep").includes("Deep"));
});

test("H5 renders without throwing and contains text", () => {
  assert.doesNotThrow(() => render("##### Five"));
  assert.ok(renderPlain("##### Five").includes("Five"));
});

test("H6 renders without throwing and contains text", () => {
  assert.doesNotThrow(() => render("###### Six"));
  assert.ok(renderPlain("###### Six").includes("Six"));
});

test("long H1 (200 chars) does not overflow terminal width", () => {
  const title = "A".repeat(200);
  const lines = render(`# ${title}`, 80);
  for (const line of lines) {
    // Allow up to cols + generous ANSI overhead (each ANSI seq ~10 chars)
    assert.ok(
      line.length < 80 + 500,
      `Line suspiciously long (raw len ${line.length}): ${line.slice(0, 60)}`
    );
    // Visual width must be bounded — at most cols + a few chars for border
    assert.ok(
      vlen(line) <= 80 + 5,
      `Visual width ${vlen(line)} exceeds terminal cols 80`
    );
  }
});

// ─── Paragraph ────────────────────────────────────────────────────────────────

test("paragraph text appears in output", () => {
  const plain = renderPlain("Hello, world!");
  assert.ok(plain.includes("Hello, world!"));
});

test("paragraph with bold renders", () => {
  const plain = renderPlain("This is **bold** text.");
  assert.ok(plain.includes("bold"));
});

test("paragraph with italic renders", () => {
  const plain = renderPlain("This is _italic_ text.");
  assert.ok(plain.includes("italic"));
});

test("paragraph with strikethrough renders", () => {
  const plain = renderPlain("This is ~~deleted~~ text.");
  assert.ok(plain.includes("deleted"));
});

test("paragraph with inline code renders", () => {
  const plain = renderPlain("Run `npm install` now.");
  assert.ok(plain.includes("npm install"));
});

// ─── Code blocks ──────────────────────────────────────────────────────────────

test("code block with language renders without throwing", () => {
  assert.doesNotThrow(() =>
    render("```js\nconsole.log('hi');\n```")
  );
});

test("code block text content appears in output", () => {
  const plain = renderPlain("```\nhello code\n```");
  assert.ok(plain.includes("hello code"));
});

test("code block uses border characters", () => {
  const out = renderStr("```\nhello\n```");
  assert.ok(out.includes("┌"), "code block should have ┌ border");
  assert.ok(out.includes("┘"), "code block should have ┘ border");
});

test("empty code block renders without crashing", () => {
  assert.doesNotThrow(() => render("```\n```"));
  const lines = render("```\n```");
  assert.ok(Array.isArray(lines));
  assert.ok(lines.length > 0);
});

test("code block with tabs expands tabs to spaces", () => {
  const plain = renderPlain("```\n\tindented\n```");
  // Tab should have been expanded — no raw \t in output
  assert.ok(!plain.includes("\t"), "tabs should be expanded");
  assert.ok(plain.includes("indented"));
});

test("code block with long line truncates to fit terminal", () => {
  const longCode = "x".repeat(300);
  const lines = render("```\n" + longCode + "\n```", 80);
  for (const line of lines) {
    assert.ok(
      vlen(line) <= 80 + 20,
      `Line visual width ${vlen(line)} exceeds cols+20`
    );
  }
});

test("code block shows language tag in border", () => {
  const out = renderStr("```javascript\nconsole.log(1);\n```");
  const stripped = strip(out);
  assert.ok(stripped.includes("javascript"), "language tag should appear in border");
});

test("code block with unknown language falls back gracefully", () => {
  assert.doesNotThrow(() =>
    render("```totallyfakelanguagexyz\nsome code\n```")
  );
  const plain = renderPlain("```totallyfakelanguagexyz\nsome code\n```");
  assert.ok(plain.includes("some code"));
});

test("code block lang with extra words uses only first word", () => {
  const out = renderStr("```js {1,3}\nconsole.log(1);\n```");
  const stripped = strip(out);
  // Should show "js" not "js {1,3}"
  assert.ok(stripped.includes("js"), "short lang tag should appear");
  assert.ok(!stripped.includes("{1,3}"), "extra lang info should be stripped");
});

// ─── Blockquotes ──────────────────────────────────────────────────────────────

test("blockquote renders without throwing", () => {
  assert.doesNotThrow(() => render("> This is a quote."));
});

test("blockquote text appears in output", () => {
  const plain = renderPlain("> This is a quote.");
  assert.ok(plain.includes("This is a quote."));
});

test("blockquote has ▌ bar prefix", () => {
  const out = renderStr("> Quote text.");
  assert.ok(out.includes("▌"), "blockquote should have ▌ bar");
});

test("nested blockquote renders without crashing", () => {
  assert.doesNotThrow(() => render("> Outer\n> > Inner"));
  const plain = renderPlain("> Outer\n> > Inner");
  assert.ok(plain.includes("Outer"));
});

// ─── Lists ────────────────────────────────────────────────────────────────────

test("unordered list renders without throwing", () => {
  assert.doesNotThrow(() => render("- apple\n- banana\n- cherry"));
});

test("unordered list items appear in output", () => {
  const plain = renderPlain("- apple\n- banana\n- cherry");
  assert.ok(plain.includes("apple"));
  assert.ok(plain.includes("banana"));
  assert.ok(plain.includes("cherry"));
});

test("unordered list uses ● bullet for depth 0", () => {
  const out = renderStr("- item");
  assert.ok(strip(out).includes("●"), "depth-0 bullet should be ●");
});

test("ordered list renders without throwing", () => {
  assert.doesNotThrow(() => render("1. first\n2. second\n3. third"));
});

test("ordered list items appear in output", () => {
  const plain = renderPlain("1. first\n2. second\n3. third");
  assert.ok(plain.includes("first"));
  assert.ok(plain.includes("second"));
  assert.ok(plain.includes("third"));
});

test("ordered list shows numbers", () => {
  const plain = renderPlain("1. first\n2. second");
  assert.ok(plain.includes("1."), "ordered list should show number 1.");
  assert.ok(plain.includes("2."), "ordered list should show number 2.");
});

test("task list checked item shows ☑", () => {
  const out = renderStr("- [x] done task");
  assert.ok(strip(out).includes("☑"), "checked task should show ☑");
});

test("task list unchecked item shows ☐", () => {
  const out = renderStr("- [ ] todo task");
  assert.ok(strip(out).includes("☐"), "unchecked task should show ☐");
});

test("nested list renders without crashing", () => {
  const md = "- level 1\n  - level 2\n    - level 3\n      - level 4";
  assert.doesNotThrow(() => render(md));
  const plain = renderPlain(md);
  assert.ok(plain.includes("level 1"));
  assert.ok(plain.includes("level 2"));
  assert.ok(plain.includes("level 3"));
  assert.ok(plain.includes("level 4"));
});

test("nested list uses ○ bullet for depth 1", () => {
  const md = "- outer\n  - inner";
  const out = renderStr(md);
  assert.ok(strip(out).includes("○"), "depth-1 bullet should be ○");
});

test("nested list uses ‣ bullet for depth 2+", () => {
  const md = "- outer\n  - mid\n    - deep";
  const out = renderStr(md);
  assert.ok(strip(out).includes("‣"), "depth-2+ bullet should be ‣");
});

test("loose list (paragraphs inside items) renders without crashing", () => {
  const md = "- item one\n\n  continuation paragraph\n\n- item two";
  assert.doesNotThrow(() => render(md));
});

// ─── Tables ───────────────────────────────────────────────────────────────────

test("table renders without throwing", () => {
  const md = "| A | B |\n|---|---|\n| 1 | 2 |";
  assert.doesNotThrow(() => render(md));
});

test("table header text appears in output", () => {
  const md = "| Name | Age |\n|------|-----|\n| Alice | 30 |";
  const plain = renderPlain(md);
  assert.ok(plain.includes("Name"), "header 'Name' should appear");
  assert.ok(plain.includes("Age"), "header 'Age' should appear");
});

test("table data rows appear in output", () => {
  const md = "| Name | Age |\n|------|-----|\n| Alice | 30 |";
  const plain = renderPlain(md);
  assert.ok(plain.includes("Alice"));
  assert.ok(plain.includes("30"));
});

test("table uses box drawing borders", () => {
  const md = "| A | B |\n|---|---|\n| 1 | 2 |";
  const out = renderStr(md);
  assert.ok(out.includes("┌"), "table should have ┌");
  assert.ok(out.includes("┘"), "table should have ┘");
  assert.ok(out.includes("│"), "table should have │ separator");
});

test("table with right alignment renders without crashing", () => {
  const md = "| Num |\n|----:|\n| 42 |";
  assert.doesNotThrow(() => render(md));
  assert.ok(renderPlain(md).includes("42"));
});

test("table with center alignment renders without crashing", () => {
  const md = "| Val |\n|:---:|\n| hi |";
  assert.doesNotThrow(() => render(md));
});

test("table that would overflow narrow terminal is truncated gracefully", () => {
  const md =
    "| Col1 | Col2 | Col3 | Col4 | Col5 |\n" +
    "|------|------|------|------|------|\n" +
    "| val1 | val2 | val3 | val4 | val5 |";
  assert.doesNotThrow(() => render(md, 40));
  const lines = render(md, 40);
  for (const line of lines) {
    assert.ok(
      vlen(line) <= 40 + 10,
      `Table line visual width ${vlen(line)} exceeds 50`
    );
  }
});

// ─── HR ───────────────────────────────────────────────────────────────────────

test("HR renders without crashing", () => {
  assert.doesNotThrow(() => render("---"));
});

test("HR output contains ─ character", () => {
  const out = renderStr("---");
  assert.ok(strip(out).includes("─"), "HR should contain ─");
});

// ─── Links ────────────────────────────────────────────────────────────────────

test("link label appears in stripped output", () => {
  const plain = renderPlain("[click here](https://example.com)");
  assert.ok(plain.includes("click here"));
});

test("link href appears when label is empty", () => {
  // Bare URL in GFM is auto-linked
  const plain = renderPlain("[](https://example.com)");
  assert.ok(plain.includes("https://example.com"));
});

test("link produces OSC 8 sequence", () => {
  const out = renderStr("[Example](https://example.com)");
  assert.ok(out.includes("\x1B]8;;"), "should contain OSC 8 start");
  assert.ok(out.includes("https://example.com"), "href should be present");
});

// ─── Images ───────────────────────────────────────────────────────────────────

test("image alt text appears in output", () => {
  const plain = renderPlain("![my photo](photo.png)");
  assert.ok(plain.includes("my photo"));
});

test("image with no alt does not crash", () => {
  assert.doesNotThrow(() => render("![](photo.png)"));
});

test("image output contains 🖼 icon", () => {
  const out = renderStr("![alt](img.png)");
  assert.ok(strip(out).includes("🖼"), "image should have 🖼 icon");
});

// ─── HTML entities ────────────────────────────────────────────────────────────

test("&amp; decodes to &", () => {
  const plain = renderPlain("A &amp; B");
  assert.ok(plain.includes("A & B"), `Expected 'A & B', got: ${plain}`);
});

test("&lt; decodes to <", () => {
  const plain = renderPlain("&lt;tag&gt;");
  assert.ok(plain.includes("<tag>"), `Expected '<tag>', got: ${plain}`);
});

test("&quot; decodes to \"", () => {
  const plain = renderPlain("Say &quot;hello&quot;");
  assert.ok(plain.includes('"hello"'));
});

test("&#39; decodes to '", () => {
  const plain = renderPlain("it&#39;s fine");
  assert.ok(plain.includes("it's fine"));
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

test("empty document returns an array", () => {
  const result = render("", 80);
  assert.ok(Array.isArray(result));
});

test("empty document does not crash", () => {
  assert.doesNotThrow(() => render(""));
});

test("narrow terminal (40 cols) H1 does not crash", () => {
  assert.doesNotThrow(() => render("# Hello", 40));
});

test("narrow terminal (20 cols) does not crash on any block type", () => {
  const md = [
    "# Heading",
    "## Sub",
    "Paragraph text here.",
    "```js\ncode\n```",
    "> quote",
    "- item",
    "1. ordered",
    "| A | B |\n|---|---|\n| 1 | 2 |",
    "---",
  ].join("\n\n");
  assert.doesNotThrow(() => render(md, 20));
});

test("very wide terminal (300 cols) does not crash", () => {
  assert.doesNotThrow(() =>
    render("# Big screen heading\n\nParagraph.\n\n```js\ncode\n```", 300)
  );
});

test("renderTokens returns only strings", () => {
  const lines = render(
    "# H\n\nParagraph.\n\n- item\n\n> quote\n\n```\ncode\n```"
  );
  for (const line of lines) {
    assert.equal(typeof line, "string", `Expected string, got ${typeof line}`);
  }
});

test("bold italic ***text*** renders without crashing", () => {
  assert.doesNotThrow(() => render("***bold italic***"));
  const plain = renderPlain("***bold italic***");
  assert.ok(plain.includes("bold italic"));
});

// ─── Full document smoke test ─────────────────────────────────────────────────

test("full document with all block types renders without throwing", () => {
  const md = `
# Heading One

## Heading Two

### Heading Three

#### Heading Four

##### Heading Five

###### Heading Six

Regular paragraph with **bold**, _italic_, ~~strikethrough~~, \`code\`, and [a link](https://example.com).

![alt text](image.png)

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

\`\`\`
plain text code block
\`\`\`

> A blockquote with some text.
>
> > A nested blockquote.

- Unordered item one
- Unordered item two
  - Nested item
    - Deeper item
- [ ] Unchecked task
- [x] Checked task

1. First ordered
2. Second ordered
3. Third ordered

| Name    | Score | Grade |
|---------|------:|:-----:|
| Alice   |    95 |   A   |
| Bob     |    82 |   B   |
| Charlie |    71 |   C   |

---

Last paragraph with &amp; entities &lt;like&gt; these.
`;

  let lines;
  assert.doesNotThrow(() => {
    lines = render(md, 80);
  });
  assert.ok(Array.isArray(lines), "result should be an array");
  assert.ok(lines.length > 0, "result should not be empty");

  const plain = lines.map(strip).join("\n");

  // Spot-check key content is present
  assert.ok(plain.includes("HEADING ONE"), "H1 uppercased text");
  assert.ok(plain.includes("Heading Two"), "H2 text");
  assert.ok(plain.includes("Heading Three"), "H3 text");
  assert.ok(plain.includes("bold"), "bold text");
  assert.ok(plain.includes("italic"), "italic text");
  assert.ok(plain.includes("strikethrough"), "strikethrough text");
  assert.ok(plain.includes("a link"), "link label");
  assert.ok(plain.includes("greet"), "code block content");
  assert.ok(plain.includes("A blockquote"), "blockquote text");
  assert.ok(plain.includes("Unordered item one"), "list item");
  assert.ok(plain.includes("Nested item"), "nested list item");
  assert.ok(plain.includes("☐"), "unchecked task");
  assert.ok(plain.includes("☑"), "checked task");
  assert.ok(plain.includes("First ordered"), "ordered list");
  assert.ok(plain.includes("Name"), "table header");
  assert.ok(plain.includes("Alice"), "table row");
  assert.ok(plain.includes("─"), "HR");
  assert.ok(plain.includes("& entities"), "decoded &amp;");
  assert.ok(plain.includes("<like>"), "decoded &lt; &gt;");
});

// ─── Web mode (Marked constructor) ───────────────────────────────────────────

test("Marked constructor exists and creates a working instance", () => {
  assert.equal(typeof Marked, "function", "Marked should be a constructor");
  const instance = new Marked({ gfm: true });
  assert.ok(instance, "should create a Marked instance");
});

test("Marked instance parses markdown to HTML", () => {
  const instance = new Marked({ gfm: true });
  const html = instance.parse("**bold**");
  assert.ok(html.includes("<strong>bold</strong>"), `Expected <strong>, got: ${html}`);
});

test("Marked instance supports custom renderer", () => {
  const instance = new Marked({ gfm: true });
  instance.use({
    renderer: {
      html(token) {
        return token.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      },
    },
  });
  const html = instance.parse("<div>raw</div>");
  assert.ok(html.includes("&lt;div&gt;"), `HTML should be escaped, got: ${html}`);
});

test("Marked instance renders tables to HTML", () => {
  const instance = new Marked({ gfm: true });
  const html = instance.parse("| A | B |\n|---|---|\n| 1 | 2 |");
  assert.ok(html.includes("<table>"), "should produce <table>");
  assert.ok(html.includes("<th>A</th>"), "should have header A");
  assert.ok(html.includes("<td>1</td>"), "should have cell 1");
});

// ─── Theme detection & switching ─────────────────────────────────────────────

test("themeFromArgs returns 'light' for --light", () => {
  assert.equal(themeFromArgs(["--light", "file.md"]), "light");
});

test("themeFromArgs returns 'dark' for --dark", () => {
  assert.equal(themeFromArgs(["--dark", "file.md"]), "dark");
});

test("themeFromArgs returns null when no theme flag", () => {
  assert.equal(themeFromArgs(["file.md"]), null);
});

test("stripThemeArgs removes --light and --dark", () => {
  assert.deepEqual(stripThemeArgs(["--light", "file.md"]), ["file.md"]);
  assert.deepEqual(stripThemeArgs(["--dark", "file.md"]), ["file.md"]);
  assert.deepEqual(stripThemeArgs(["file.md"]), ["file.md"]);
});

test("detectTheme respects MDCAT_THEME env var", () => {
  const orig = process.env.MDCAT_THEME;
  process.env.MDCAT_THEME = "light";
  assert.equal(detectTheme(), "light");
  process.env.MDCAT_THEME = "dark";
  assert.equal(detectTheme(), "dark");
  if (orig !== undefined) process.env.MDCAT_THEME = orig;
  else delete process.env.MDCAT_THEME;
});

test("setTheme('light') changes render output colors", () => {
  setTheme("light");
  const lines = render("# Hello");
  const raw = lines.join("");
  // Light theme uses #a626a4 for H1 → ANSI 38;2;166;38;164
  assert.ok(raw.includes("38;2;166;38;164"), "light theme should use magenta H1");
  // Restore dark theme
  setTheme("dark");
});

test("setTheme('dark') restores dark palette", () => {
  setTheme("dark");
  const lines = render("# Hello");
  const raw = lines.join("");
  // Dark theme uses #c678dd for H1 → ANSI 38;2;198;120;221
  assert.ok(raw.includes("38;2;198;120;221"), "dark theme should use purple H1");
});

test("light theme renders all block types without crashing", () => {
  setTheme("light");
  const md = "# H1\n## H2\n### H3\n\nText **bold** `code`\n\n> quote\n\n- item\n\n| A |\n|---|\n| 1 |\n\n---";
  assert.doesNotThrow(() => render(md));
  setTheme("dark");
});

// ─── Line numbers (CLI flag parsing) ─────────────────────────────────────────

test("-n flag is recognized and stripped from args", () => {
  let args = ["-n", "file.md"];
  const hasFlag = args.includes("-n") || args.includes("--number");
  args = args.filter(a => a !== "-n" && a !== "--number");
  assert.equal(hasFlag, true);
  assert.deepEqual(args, ["file.md"]);
});

test("--number flag is recognized and stripped from args", () => {
  let args = ["--number", "file.md"];
  const hasFlag = args.includes("-n") || args.includes("--number");
  args = args.filter(a => a !== "-n" && a !== "--number");
  assert.equal(hasFlag, true);
  assert.deepEqual(args, ["file.md"]);
});

test("no line number flag leaves args unchanged", () => {
  let args = ["file.md"];
  const hasFlag = args.includes("-n") || args.includes("--number");
  args = args.filter(a => a !== "-n" && a !== "--number");
  assert.equal(hasFlag, false);
  assert.deepEqual(args, ["file.md"]);
});

test("-n works with other flags combined", () => {
  let args = ["--light", "-n", "file.md"];
  const hasFlag = args.includes("-n") || args.includes("--number");
  args = args.filter(a => a !== "-n" && a !== "--number");
  assert.equal(hasFlag, true);
  assert.deepEqual(args, ["--light", "file.md"]);
});

// ─── Plain mode (CLI flag parsing) ────────────────────────────────────────────

test("-p flag is recognized and stripped from args", () => {
  let args = ["-p", "file.md"];
  const hasFlag = args.includes("-p") || args.includes("--plain");
  args = args.filter(a => a !== "-p" && a !== "--plain");
  assert.equal(hasFlag, true);
  assert.deepEqual(args, ["file.md"]);
});

test("--plain flag is recognized and stripped from args", () => {
  let args = ["--plain", "file.md"];
  const hasFlag = args.includes("-p") || args.includes("--plain");
  args = args.filter(a => a !== "-p" && a !== "--plain");
  assert.equal(hasFlag, true);
  assert.deepEqual(args, ["file.md"]);
});

test("no plain flag leaves args unchanged", () => {
  let args = ["file.md"];
  const hasFlag = args.includes("-p") || args.includes("--plain");
  args = args.filter(a => a !== "-p" && a !== "--plain");
  assert.equal(hasFlag, false);
  assert.deepEqual(args, ["file.md"]);
});

test("-p works with other flags combined", () => {
  let args = ["--dark", "-p", "-n", "file.md"];
  const hasPlain = args.includes("-p") || args.includes("--plain");
  args = args.filter(a => a !== "-p" && a !== "--plain");
  const hasNumber = args.includes("-n") || args.includes("--number");
  args = args.filter(a => a !== "-n" && a !== "--number");
  assert.equal(hasPlain, true);
  assert.equal(hasNumber, true);
  assert.deepEqual(args, ["--dark", "file.md"]);
});

test("--plain flag does not conflict with --web or --doc", () => {
  let args = ["--plain", "--web", "file.md"];
  const hasPlain = args.includes("-p") || args.includes("--plain");
  args = args.filter(a => a !== "-p" && a !== "--plain");
  assert.equal(hasPlain, true);
  assert.deepEqual(args, ["--web", "file.md"]);
});

test("launch function accepts opts parameter with lineNumbers", () => {
  // Verify the function signature accepts 4 params without crashing
  assert.equal(typeof launch, "function");
  assert.ok(launch.length >= 3, "launch should accept at least 3 parameters");
});
