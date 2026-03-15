import { Chalk } from "chalk";
import wrapAnsi from "wrap-ansi";
import { highlight as cliHighlight } from "cli-highlight";

const chalk = new Chalk({ level: 3 });

// ─── One Dark palette ──────────────────────────────────────────────────────────
const c = {
  // Headings
  h1:       chalk.hex("#c678dd").bold,          // purple
  h2:       chalk.hex("#61afef").bold,          // blue
  h3:       chalk.hex("#98c379").bold,          // green
  h4:       chalk.hex("#e5c07b").bold,          // yellow
  h5:       chalk.hex("#56b6c2"),               // cyan
  h6:       chalk.dim,
  // Inline
  strong:   chalk.bold.white,
  em:       chalk.italic,
  del:      chalk.strikethrough.dim,
  code:     chalk.hex("#e5c07b").bgHex("#2a2a2a"), // amber on dark bg
  link:     chalk.hex("#61afef").underline,
  image:    chalk.dim,
  // Code block
  border:   chalk.dim,
  codeLang: chalk.hex("#e5c07b").dim,
  // Blockquote
  bqBar:    chalk.hex("#e5c07b"),
  bqText:   chalk.dim.italic,
  // Lists
  bullet0:  chalk.hex("#61afef"),              // blue ● depth 0
  bullet1:  chalk.dim,                         // dim ○ depth 1
  bullet2:  chalk.dim,                         // very dim ‣ depth 2+
  ordered:  chalk.hex("#56b6c2"),              // cyan number
  taskDone: chalk.hex("#98c379"),              // green ☑
  taskTodo: chalk.dim,                         // dim ☐
  // Table
  tableBorder: chalk.dim,
  tableHead:   chalk.hex("#61afef").bold,
  tableCell:   chalk.reset,
  // HR
  hr:       chalk.dim,
  // Paragraph text
  fg:       chalk.reset,
};

const MARGIN = "  "; // 2-space left margin

// ─── Visual width helpers ───────────────────────────────────────────────────────

/** Strip all ANSI SGR sequences and OSC 8 hyperlinks to measure visual width. */
function vlen(s) {
  return s
    .replace(/\x1B\]8;;.*?\x1B\\/gs, "")
    .replace(/\x1B\[[0-9;]*m/g, "")
    .length;
}

/**
 * ANSI-safe truncation. Walks the string character by character, skipping
 * escape sequences when counting visual width. Appends reset + ellipsis when
 * the string is truncated.
 */
function vtrunc(s, maxW) {
  if (vlen(s) <= maxW) return s;
  let vis = 0;
  let i = 0;
  while (i < s.length && vis < maxW) {
    // OSC 8 hyperlink: ESC ] 8 ; ... ST  (ST = ESC \)
    if (s[i] === "\x1B" && s[i + 1] === "]") {
      const end = s.indexOf("\x1B\\", i + 2);
      if (end !== -1) { i = end + 2; continue; }
    }
    // CSI SGR sequence: ESC [ ... m
    if (s[i] === "\x1B" && s[i + 1] === "[") {
      const end = s.indexOf("m", i + 2);
      if (end !== -1) { i = end + 1; continue; }
    }
    vis++;
    i++;
  }
  return s.slice(0, i) + "\x1B[0m…";
}

/** Pad string to visual width n. */
function vpad(s, n) {
  return s + " ".repeat(Math.max(0, n - vlen(s)));
}

// ─── HTML entity decoder ────────────────────────────────────────────────────────

function htmlDecode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// ─── Inline renderer ───────────────────────────────────────────────────────────

function inline(tokens) {
  if (!tokens?.length) return "";
  return tokens
    .map((tok) => {
      switch (tok.type) {
        case "text":
          return tok.tokens ? inline(tok.tokens) : htmlDecode(tok.text ?? "");
        case "strong":
          return c.strong(inline(tok.tokens));
        case "em":
          return c.em(inline(tok.tokens));
        case "del":
          return c.del(inline(tok.tokens));
        case "codespan":
          return c.code(" " + (tok.text ?? "") + " ");
        case "link": {
          const href = tok.href ?? "";
          // Badge pattern: link whose only child is a single image (e.g. shields.io)
          // Render as a compact [alt] text tag instead of a broken image icon.
          if (tok.tokens?.length === 1 && tok.tokens[0].type === "image") {
            const alt = tok.tokens[0].text || tok.tokens[0].alt || "";
            if (alt) {
              const badge = chalk.dim("[") + chalk.hex("#abb2bf")(alt) + chalk.dim("]");
              return `\x1B]8;;${href}\x1B\\${badge}\x1B]8;;\x1B\\`;
            }
          }
          const label = tok.tokens?.length ? inline(tok.tokens) : href;
          // OSC 8 clickable hyperlink (iTerm2, Kitty, WezTerm, foot, …)
          return `\x1B]8;;${href}\x1B\\${c.link(label)}\x1B]8;;\x1B\\`;
        }
        case "image":
          return c.image(`🖼  ${tok.text || tok.alt || "image"}`);
        case "br":
          return "\n";
        case "escape":
          return tok.text ?? "";
        case "html":
          return "";
        default:
          return tok.raw ?? "";
      }
    })
    .join("");
}

// ─── Block renderers ───────────────────────────────────────────────────────────

function heading(tok, w) {
  const text = inline(tok.tokens);
  const lines = [""];

  switch (tok.depth) {
    case 1: {
      // Purple box with Unicode border
      const label = text.toUpperCase();
      const safeLabel = vlen(label) > w - 4 ? vtrunc(label, w - 4) : label;
      const tlen = vlen(safeLabel);
      const innerW = tlen + 2; // 1 space padding each side
      const topBot = "═".repeat(innerW);
      lines.push(MARGIN + c.h1("╔" + topBot + "╗"));
      lines.push(MARGIN + c.h1("║") + " " + c.h1(safeLabel) + " " + c.h1("║"));
      lines.push(MARGIN + c.h1("╚" + topBot + "╝"));
      break;
    }
    case 2: {
      lines.push(MARGIN + c.h2(text));
      const barLen = Math.min(vlen(text) + 1, w);
      lines.push(MARGIN + c.h2("─".repeat(barLen)));
      break;
    }
    case 3:
      lines.push(MARGIN + c.h3(text));
      break;
    case 4:
      lines.push(MARGIN + c.h4(text));
      break;
    case 5:
      lines.push(MARGIN + c.h5(text));
      break;
    case 6:
      lines.push(MARGIN + c.h6(text));
      break;
    default:
      lines.push(MARGIN + text);
  }

  lines.push("");
  return lines;
}

function paragraph(tok, w) {
  const text = inline(tok.tokens);
  const wrapped = wrapAnsi(text, w, { hard: true, trim: false });
  return [...wrapped.split("\n").map((l) => MARGIN + c.fg(l)), ""];
}

function code(tok, w) {
  // First word of lang only, e.g. "js {1}" → "js"
  const lang = (tok.lang ?? "").split(/\s/)[0].trim();
  // Expand tabs to 2 spaces
  const rawText = (tok.text ?? "").replace(/\t/g, "  ");

  let rawLines;
  if (rawText === "") {
    rawLines = [""];
  } else {
    rawLines = rawText.split("\n");
  }

  let highlighted;
  try {
    if (lang) {
      const h = cliHighlight(rawText || " ", {
        language: lang,
        ignoreIllegals: true,
      });
      highlighted = h.split("\n").map((l) => l + "\x1B[0m");
      // Trim to match source line count (cli-highlight may add a trailing empty)
      if (
        highlighted.length > rawLines.length &&
        vlen(highlighted[highlighted.length - 1]) === 0
      ) {
        highlighted.pop();
      }
    } else {
      highlighted = rawLines;
    }
  } catch {
    highlighted = rawLines;
  }

  // Pad to same length just in case highlight produced different line count
  while (highlighted.length < rawLines.length) highlighted.push("");

  // Size the box to the longest line (capped at terminal width)
  const maxLineW = highlighted.reduce((m, l) => Math.max(m, vlen(l)), 0);
  const langTagLen = lang ? 1 + lang.length + 1 : 0; // " lang " visual chars
  // innerW = content area between pipes (1 space padding each side)
  // Must fit: longest line, lang tag in top border, and minimum 4 chars
  const innerW = Math.min(w - 2, Math.max(maxLineW, langTagLen + 2, 4));
  // borderW = total inner span for the box (includes the 1-char padding each side)
  const borderW = innerW + 2;

  const lines = [""];

  // Top border: ┌─ lang ─────┐ or ┌──────────────┐
  let top;
  if (lang) {
    const langTag = " " + c.codeLang(lang) + " ";
    const fill = Math.max(0, borderW - langTagLen - 1); // -1 for leading "─"
    top =
      c.border("┌─") +
      langTag +
      c.border("─".repeat(fill)) +
      c.border("┐");
  } else {
    top = c.border("┌" + "─".repeat(borderW) + "┐");
  }
  lines.push(MARGIN + top);

  // Content lines
  for (const hline of highlighted) {
    const truncated =
      vlen(hline) > innerW ? vtrunc(hline, innerW) : hline;
    const pad = Math.max(0, innerW - vlen(truncated));
    lines.push(
      MARGIN +
        c.border("│") +
        " " +
        truncated +
        " ".repeat(pad) +
        " " +
        c.border("│")
    );
  }

  // Bottom border
  lines.push(MARGIN + c.border("└" + "─".repeat(borderW) + "┘"));
  lines.push("");
  return lines;
}

function blockquote(tok, w) {
  // Render inner tokens at reduced width
  const innerLines = tok.tokens.flatMap((t) => {
    try {
      return token(t, w - 4);
    } catch {
      return [""];
    }
  });

  const prefix = MARGIN + c.bqBar("▌") + " ";
  const out = [""];
  for (const l of innerLines) {
    const stripped = l.replace(/^[ \t]*/, ""); // strip leading indent from inner render
    out.push(prefix + c.bqText(stripped));
  }
  out.push("");
  return out;
}

function list(tok, w, depth) {
  const pad = "  ".repeat(depth);
  const lines = [];

  tok.items.forEach((item, i) => {
    // Bullet / number
    let bullet;
    if (item.task) {
      // Task list: handled below after building firstLine
      bullet = "  "; // placeholder width
    } else if (tok.ordered) {
      const num = String((tok.start ?? 1) + i);
      bullet = c.ordered(num + ".");
    } else {
      if (depth === 0) bullet = c.bullet0("●");
      else if (depth === 1) bullet = c.bullet1("○");
      else bullet = c.bullet2("‣");
    }

    let firstLine = "";
    const extraLines = [];

    for (const t of item.tokens) {
      if (t.type === "text") {
        firstLine += inline(t.tokens ?? [{ type: "text", text: t.text ?? "" }]);
      } else if (t.type === "paragraph") {
        firstLine += inline(t.tokens);
      } else if (t.type === "list") {
        extraLines.push(...list(t, w - 2, depth + 1));
      } else {
        try {
          const inner = token(t, w - 2);
          // Skip blank separator lines within loose lists
          inner.forEach((l) => {
            if (l !== "") extraLines.push(l);
          });
        } catch {
          // skip
        }
      }
    }

    // Task list overlay
    if (item.task) {
      const box = item.checked
        ? c.taskDone("☑")
        : c.taskTodo("☐");
      bullet = box;
    }

    const prefix = MARGIN + pad + bullet + " ";
    const textIndent = MARGIN + pad + " ".repeat(vlen(bullet) + 1);
    const wrapW = Math.max(20, w - vlen(MARGIN + pad + " ") - vlen(bullet));
    const wrapped = wrapAnsi(firstLine, wrapW, { hard: true });
    const wrappedLines = wrapped.split("\n");
    lines.push(prefix + wrappedLines[0]);
    wrappedLines.slice(1).forEach((l) => lines.push(textIndent + l));
    lines.push(...extraLines);
  });

  return lines;
}

function table(tok, w) {
  const headers = tok.header.map((h) => inline(h.tokens ?? []));
  const rows = tok.rows.map((row) =>
    row.map((cell) => inline(cell.tokens ?? []))
  );
  const aligns = tok.align ?? [];

  // Natural column widths
  const colWidths = headers.map((h, i) => {
    const maxCell = rows.reduce(
      (m, r) => Math.max(m, vlen(r[i] ?? "")),
      0
    );
    return Math.max(vlen(h), maxCell, 1);
  });

  // Total table width: borders (cols+1) + 2 padding per col + content
  const totalW =
    colWidths.length + 1 + colWidths.reduce((s, cw) => s + cw + 2, 0);
  const marginLen = vlen(MARGIN);

  // If table overflows, shrink columns proportionally
  if (totalW + marginLen > w) {
    const available = w - marginLen - (colWidths.length + 1) - colWidths.length * 2;
    const naturalTotal = colWidths.reduce((s, cw) => s + cw, 0);
    if (naturalTotal > 0 && available > 0) {
      let allocated = 0;
      const minW = 3; // minimum column width to show "…"
      for (let i = 0; i < colWidths.length; i++) {
        const share = Math.max(
          minW,
          Math.floor((colWidths[i] / naturalTotal) * available)
        );
        colWidths[i] = share;
        allocated += share;
      }
      // Distribute rounding remainder to last column
      const remainder = available - allocated;
      if (remainder > 0) colWidths[colWidths.length - 1] += remainder;
    }
  }

  const D = c.tableBorder;
  const top = D("┌" + colWidths.map((cw) => "─".repeat(cw + 2)).join("┬") + "┐");
  const mid = D("├" + colWidths.map((cw) => "─".repeat(cw + 2)).join("┼") + "┤");
  const bot = D("└" + colWidths.map((cw) => "─".repeat(cw + 2)).join("┴") + "┘");
  const sep = D("│");

  function alignCell(cell, cw, align) {
    const cellLen = vlen(cell);
    const truncated = cellLen > cw ? vtrunc(cell, cw) : cell;
    const tlen = vlen(truncated);
    if (align === "right") {
      return " ".repeat(Math.max(0, cw - tlen)) + truncated;
    }
    if (align === "center") {
      const total = Math.max(0, cw - tlen);
      const left = Math.floor(total / 2);
      const right = total - left;
      return " ".repeat(left) + truncated + " ".repeat(right);
    }
    // left / default
    return vpad(truncated, cw);
  }

  const headerRow =
    sep +
    headers
      .map(
        (h, i) =>
          " " + c.tableHead(alignCell(h, colWidths[i], aligns[i])) + " " + sep
      )
      .join("");

  const dataRows = rows.map(
    (row) =>
      sep +
      row
        .map(
          (cell, i) =>
            " " +
            c.tableCell(alignCell(cell ?? "", colWidths[i], aligns[i])) +
            " " +
            sep
        )
        .join("")
  );

  return [
    "",
    ...[top, headerRow, mid, ...dataRows, bot].map((l) => MARGIN + l),
    "",
  ];
}

function hr(w) {
  return [MARGIN + c.hr("─".repeat(Math.max(1, w))), ""];
}

// ─── Token dispatcher ──────────────────────────────────────────────────────────

function token(tok, w, tableW) {
  try {
    switch (tok.type) {
      case "heading":
        return heading(tok, w);
      case "paragraph":
        return paragraph(tok, w);
      case "code":
        return code(tok, w);
      case "blockquote":
        return blockquote(tok, w);
      case "list":
        return ["", ...list(tok, w, 0), ""];
      case "table":
        return table(tok, tableW ?? w);
      case "hr":
        return hr(w);
      case "space":
      case "html":
      case "def":
        return [];
      default:
        return [];
    }
  } catch {
    return [""];
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Render an array of marked tokens to an array of ANSI-coloured terminal lines.
 *
 * @param {import("marked").Token[]} tokens  - Output of `marked.lexer()`
 * @param {number} cols                      - Terminal width (default 80)
 * @param {number} [fullCols]               - Uncapped terminal width for tables
 * @returns {string[]}
 */
export function renderTokens(tokens, cols = 80, fullCols) {
  const w = Math.max(20, cols - MARGIN.length * 2);
  const tableW = fullCols ? Math.max(20, fullCols - MARGIN.length * 2) : undefined;
  return tokens.flatMap((tok) => token(tok, w, tableW));
}
