import { execFileSync } from "child_process";

const ESC = "\x1B";
const ALT_ON    = `${ESC}[?1049h`;
const ALT_OFF   = `${ESC}[?1049l`;
const HIDE_CUR  = `${ESC}[?25l`;
const SHOW_CUR  = `${ESC}[?25h`;
const MOUSE_ON  = `${ESC}[?1000h${ESC}[?1006h`;
const MOUSE_OFF = `${ESC}[?1000l${ESC}[?1006l`;
const HOME      = `${ESC}[H`;
const ERASE_L   = `${ESC}[2K`;
const RESET     = `${ESC}[0m`;
const move      = (r, c) => `${ESC}[${r};${c}H`;

// Color palettes for TUI chrome (24-bit ANSI)
const DARK = {
  chromeBg:    `${ESC}[48;2;33;37;43m`,    // #21252b
  badge:       `${ESC}[38;2;198;120;221m`,  // #c678dd  — purple badge
  titleFg:     `${ESC}[97m`,                // bright white — filename
  dimFg:       `${ESC}[38;2;92;99;112m`,   // #5c6370
  accentFg:    `${ESC}[38;2;97;175;239m`,  // #61afef
  matchFg:     `${ESC}[38;2;229;192;123m`, // #e5c07b
  greenFg:     `${ESC}[38;2;152;195;121m`, // #98c379
  redFg:       `${ESC}[38;2;224;108;117m`, // #e06c75
  otherMatchFg:`${ESC}[38;2;92;99;112m`,   // #5c6370
  hlMatch:     `${ESC}[48;2;62;68;82m${ESC}[38;2;229;192;123m`,
  hlCurrent:   `${ESC}[48;2;229;192;123m${ESC}[38;2;0;0;0m`,
};

const LIGHT = {
  chromeBg:    `${ESC}[48;2;228;228;228m`, // #e4e4e4
  badge:       `${ESC}[38;2;166;38;164m`,  // #a626a4  — magenta badge
  titleFg:     `${ESC}[30m`,               // black — filename
  dimFg:       `${ESC}[38;2;105;108;119m`, // #696c77
  accentFg:    `${ESC}[38;2;64;120;242m`,  // #4078f2
  matchFg:     `${ESC}[38;2;152;104;1m`,   // #986801
  greenFg:     `${ESC}[38;2;80;161;79m`,   // #50a14f
  redFg:       `${ESC}[38;2;228;86;73m`,   // #e45649
  otherMatchFg:`${ESC}[38;2;105;108;119m`, // #696c77
  hlMatch:     `${ESC}[48;2;209;226;255m${ESC}[38;2;64;120;242m`,
  hlCurrent:   `${ESC}[48;2;64;120;242m${ESC}[38;2;255;255;255m`,
};

let C = { ...DARK,
  bold:        `${ESC}[1m`,
  dim:         `${ESC}[2m`,
  italic:      `${ESC}[3m`,
  rev:         `${ESC}[7m`,
  revOff:      `${ESC}[27m`,
};

// Highlight colors for annotated text (highlighter pen effect)
const HL_NOTE_DARK  = `${ESC}[48;2;62;58;32m`;  // warm dark yellow bg
const HL_NOTE_LIGHT = `${ESC}[48;2;255;243;191m`; // pale yellow bg
const HL_NOTE_OFF   = `${ESC}[49m`;
const NOTE_STAR     = `${ESC}[38;2;229;192;123m*${ESC}[39m`;

/**
 * Highlight all occurrences of `anchor` text within an ANSI-coloured line
 * with a background color (like a highlighter pen) and append a *.
 */
function highlightAnchor(line, anchor, isLight) {
  if (!anchor) return line;
  const p = plain(line);
  const idx = p.indexOf(anchor);
  if (idx === -1) return line;
  const endIdx = idx + anchor.length;

  const hlOn = isLight ? HL_NOTE_LIGHT : HL_NOTE_DARK;
  let out = "";
  let vis = 0;
  let inside = false;
  let i = 0;
  while (i < line.length) {
    if (!inside && vis === idx)    { out += hlOn; inside = true; }
    if (inside  && vis === endIdx) { out += HL_NOTE_OFF + NOTE_STAR; inside = false; }

    if (line[i] === "\x1B" && line[i + 1] === "]") {
      const end = line.indexOf("\x1B\\", i + 2);
      if (end !== -1) { out += line.slice(i, end + 2); i = end + 2; continue; }
    }
    if (line[i] === "\x1B" && line[i + 1] === "[") {
      const end = line.indexOf("m", i + 2);
      if (end !== -1) { out += line.slice(i, end + 1); i = end + 1; continue; }
    }
    out += line[i]; vis++; i++;
  }
  if (inside) out += HL_NOTE_OFF + NOTE_STAR;
  return out;
}

/**
 * Render a line with character-level cursor and optional selection highlight.
 * Returns the line with the cursor/selection ANSI injected.
 */
function renderSelection(line, col, start, end) {
  const p = plain(line);
  const hasSelection = start >= 0 && end >= 0 && start !== end;
  const sMin = hasSelection ? Math.min(start, end) : -1;
  const sMax = hasSelection ? Math.max(start, end) : -1;

  let out = "";
  let vis = 0;
  let i = 0;
  while (i < line.length) {
    // Open selection highlight
    if (hasSelection && vis === sMin) out += `${ESC}[7m`;
    // Close selection highlight
    if (hasSelection && vis === sMax) out += `${ESC}[27m`;
    // Cursor indicator (reverse the single char)
    if (!hasSelection && vis === col) out += `${ESC}[7m`;
    if (!hasSelection && vis === col + 1) out += `${ESC}[27m`;

    if (line[i] === "\x1B" && line[i + 1] === "]") {
      const end2 = line.indexOf("\x1B\\", i + 2);
      if (end2 !== -1) { out += line.slice(i, end2 + 2); i = end2 + 2; continue; }
    }
    if (line[i] === "\x1B" && line[i + 1] === "[") {
      const end2 = line.indexOf("m", i + 2);
      if (end2 !== -1) { out += line.slice(i, end2 + 1); i = end2 + 1; continue; }
    }
    out += line[i]; vis++; i++;
  }
  // If cursor is at end of line
  if (!hasSelection && vis === col) out += `${ESC}[7m ${ESC}[27m`;
  if (hasSelection && vis <= sMax) out += `${ESC}[27m`;
  return out;
}

// Strip ANSI from a line to get searchable plain text
const STRIP_SGR = /\x1B\[[0-9;]*m/g;
const STRIP_OSC = /\x1B\]8;;.*?\x1B\\/gs;
function plain(line) {
  return line.replace(STRIP_OSC, "").replace(STRIP_SGR, "");
}

// Visual width of a plain string (already stripped)
function plen(s) { return s.replace(/\x1B\[[0-9;]*m/g, "").length; }

// Highlight all occurrences of `query` within an ANSI-coloured line.
// Walks the string char-by-char so ANSI escape sequences don't shift offsets.
let HL_MATCH   = C.hlMatch;
let HL_CURRENT = C.hlCurrent;
const HL_OFF   = `${ESC}[49m${ESC}[39m`;

function highlightInLine(line, query, isCurrent) {
  if (!query) return line;
  const p = plain(line).toLowerCase();
  const q = query.toLowerCase();

  // Collect all [start, end) ranges in plain-text coordinates
  const ranges = [];
  let pos = 0;
  while ((pos = p.indexOf(q, pos)) !== -1) {
    ranges.push([pos, pos + q.length]);
    pos++;
  }
  if (!ranges.length) return line;

  const ON = isCurrent ? HL_CURRENT : HL_MATCH;

  let out = "";
  let vis = 0;  // visual position in plain text
  let ri  = 0;  // current range index
  let hl  = false;
  let i   = 0;  // byte index into line

  while (i < line.length) {
    // Close highlight when we exit the current range
    if (hl && ri < ranges.length && vis >= ranges[ri][1]) {
      out += HL_OFF;
      hl = false;
      ri++;
    }
    // Open highlight when we enter the next range
    if (!hl && ri < ranges.length && vis >= ranges[ri][0]) {
      out += ON;
      hl = true;
    }

    // OSC 8 hyperlink: ESC ] 8 ; ; url ESC \  — skip, no visual width
    if (line[i] === "\x1B" && line[i + 1] === "]") {
      const end = line.indexOf("\x1B\\", i + 2);
      if (end !== -1) { out += line.slice(i, end + 2); i = end + 2; continue; }
    }
    // CSI SGR: ESC [ … m — skip, no visual width
    if (line[i] === "\x1B" && line[i + 1] === "[") {
      const end = line.indexOf("m", i + 2);
      if (end !== -1) { out += line.slice(i, end + 1); i = end + 1; continue; }
    }

    out += line[i];
    vis++;
    i++;
  }

  if (hl) out += HL_OFF;
  return out;
}

function copyText(text) {
  // OSC 52 — works in iTerm2, Kitty, WezTerm, tmux (with allow-passthrough)
  const b64 = Buffer.from(text).toString("base64");
  process.stdout.write(`${ESC}]52;c;${b64}${ESC}\\`);
  // pbcopy fallback for macOS
  try { execFileSync("pbcopy", [], { input: text, stdio: ["pipe", "ignore", "ignore"] }); }
  catch { /* not on macOS or pbcopy unavailable */ }
}

export function launch(title, lines, theme, opts = {}) {
  // Apply theme to TUI chrome
  if (theme === "light") {
    const pal = LIGHT;
    Object.assign(C, pal);
    HL_MATCH = pal.hlMatch;
    HL_CURRENT = pal.hlCurrent;
  }

  // Line numbers
  let lineNumbers = opts.lineNumbers ?? false;
  const totalDigits = String(lines.length).length;
  const gutterW = totalDigits + 2; // "  N " width

  // Git diff map (rendered line index → "added" | "modified" | "deleted")
  const diffMap = opts.diffMap ?? new Map();

  // Notes (anchor-based: each note has .anchor text fragment + .text)
  let notes = opts.notes ?? [];                      // Array of { anchor, text, lineHint, created }
  let noteLineMap = opts.noteLineMap ?? new Map();   // rendered lineIdx → Array<{anchor, text}>
  let showNotes = false;                             // Tab toggle
  const filePath = opts.filePath ?? null;
  const saveFn = opts.saveNotes ?? (() => {});       // saveNotes callback

  // Viewport state
  let offset = 0;
  let cursor = 0;  // absolute line index of the cursor (highlighted line)

  // Selection state (character-level within a line)
  let selCol     = 0;     // character cursor position in plain text
  let selStart   = -1;    // selection start column (-1 = not selecting)
  let selEnd     = -1;    // selection end column
  let selText    = "";    // the selected text fragment

  // Search state
  let mode        = "normal";   // "normal" | "search" | "matches" | "note" | "select"
  let searchQuery = "";
  let noteInput   = "";         // note text being typed
  let matchLines  = [];         // sorted array of line indices with matches
  let matchSet    = new Set();  // for O(1) gutter lookup
  let matchIdx    = 0;

  // Mouse / clipboard state
  let mouseEnabled = false;
  let toast        = "";        // brief status message
  let toastTimer   = null;

  const rows    = () => process.stdout.rows    || 24;
  const cols    = () => process.stdout.columns || 80;
  const visible = () => Math.max(1, rows() - 2); // top bar + bottom bar
  const maxOff  = () => Math.max(0, lines.length - visible());

  // ─── Search helpers ────────────────────────────────────────────────────────

  function computeMatches() {
    if (!searchQuery) {
      matchLines = []; matchSet = new Set(); matchIdx = 0;
      return;
    }
    const q = searchQuery.toLowerCase();
    matchLines = lines.reduce((acc, line, i) => {
      if (plain(line).toLowerCase().includes(q)) acc.push(i);
      return acc;
    }, []);
    matchSet = new Set(matchLines);
    matchIdx = 0;
    if (matchLines.length > 0) scrollToMatch(0);
  }

  function rebuildNoteMap() {
    noteLineMap = new Map();
    for (let li = 0; li < lines.length; li++) {
      const pl = plain(lines[li]);
      for (const note of notes) {
        if (pl.includes(note.anchor)) {
          if (!noteLineMap.has(li)) noteLineMap.set(li, []);
          noteLineMap.get(li).push({ anchor: note.anchor, text: note.text });
        }
      }
    }
  }

  function scrollToMatch(idx) {
    matchIdx = ((idx % matchLines.length) + matchLines.length) % matchLines.length;
    const target = matchLines[matchIdx];
    if (target !== undefined) {
      offset = Math.max(0, Math.min(target - Math.floor(visible() / 2), maxOff()));
    }
  }

  // ─── Draw ──────────────────────────────────────────────────────────────────

  function draw() {
    const h = rows();
    const w = cols();
    const out = [HOME];

    // Row 1: top chrome bar
    out.push(move(1, 1) + ERASE_L + topBar(title, w));

    // Rows 2..h-1: content with optional gutter + search highlighting + notes
    const slice = lines.slice(offset, offset + visible());
    let row = 0;
    for (let i = 0; i < visible() && row < visible(); i++) {
      const absLine = offset + i;
      const gutter  = gutterFor(absLine);
      let   content = slice[i] ?? "";
      if (searchQuery && matchSet.has(absLine)) {
        content = highlightInLine(content, searchQuery, matchLines[matchIdx] === absLine);
      }
      // Highlight annotated text fragments with background + asterisk
      if (noteLineMap.has(absLine)) {
        for (const n of noteLineMap.get(absLine)) {
          content = highlightAnchor(content, n.anchor, theme === "light");
        }
      }
      // Select mode: show char cursor / selection on the cursor line
      if (mode === "select" && absLine === cursor) {
        content = renderSelection(content, selCol, selStart, selEnd);
      }
      // Highlight cursor line with a subtle background
      const isCursor = absLine === cursor;
      const cursorBg = theme === "light" ? `${ESC}[48;2;232;232;240m` : `${ESC}[48;2;40;44;52m`;
      const cursorOn = isCursor && mode !== "select" ? cursorBg : "";
      const cursorOff = isCursor && mode !== "select" ? RESET : "";
      out.push(move(row + 2, 1) + ERASE_L + cursorOn + gutter + content + cursorOff);
      row++;
      // Show inline note below annotated line
      if (showNotes && noteLineMap.has(absLine)) {
        const notePrefix = lineNumbers ? " ".repeat(totalDigits + 1) : "  ";
        for (const n of noteLineMap.get(absLine)) {
          if (row >= visible()) break;
          out.push(move(row + 2, 1) + ERASE_L + `${notePrefix}${C.matchFg}  > ${C.dim}${n.anchor}${RESET}${C.matchFg}: ${n.text}${RESET}`);
          row++;
        }
      }
    }
    // Clear remaining rows
    for (; row < visible(); row++) {
      out.push(move(row + 2, 1) + ERASE_L);
    }

    // Row h: status / search bar
    out.push(move(h, 1) + ERASE_L + statusBar(w));

    // Show cursor only in search mode (for the text input)
    out.push(mode === "search" || mode === "note" || mode === "select" ? SHOW_CUR : HIDE_CUR);

    process.stdout.write(out.join(""));
  }

  // ─── Chrome helpers ────────────────────────────────────────────────────────

  function topBar(title, w) {
    const left  = ` ${C.bold}${C.titleFg}${title}${RESET}${C.chromeBg}`;
    const cat   = `${C.dimFg}/\\${RESET}${C.chromeBg}${C.accentFg}(o.o)${RESET}${C.chromeBg}${C.dimFg}/\\ mdcat ${RESET}`;
    const leftW = 1 + title.length;
    const rightW = "/\\(o.o)/\\ mdcat ".length;
    const gap   = Math.max(0, w - leftW - rightW);
    return `${C.chromeBg}${left}${C.dimFg}${" ".repeat(gap)}${cat}${RESET}`;
  }

  function diffMarkerFor(absLine) {
    const type = diffMap.get(absLine);
    if (!type) return "";
    if (type === "added")    return `${C.greenFg}+${RESET}`;
    if (type === "modified") return `${C.matchFg}~${RESET}`;
    if (type === "deleted")  return `${C.redFg}-${RESET}`;
    return "";
  }

  function gutterFor(absLine) {
    let prefix = "";
    if (lineNumbers) {
      const num = String(absLine + 1).padStart(totalDigits);
      prefix = `${C.dimFg}${num}${RESET} `;
    }

    // Diff gutter marker (single char column before content)
    const diff = diffMap.size > 0 ? (diffMarkerFor(absLine) || " ") : "";

    const gutterSuffix = diff || "";
    const pad = gutterSuffix ? " " : (prefix ? "" : "  ");

    if (mode === "normal" || mode === "note" || !searchQuery) return `${prefix}${gutterSuffix}${pad}`;
    if (matchLines[matchIdx] === absLine)   return `${prefix}${gutterSuffix ? gutterSuffix + " " : ""}${C.matchFg}▶${RESET} `;
    if (matchSet.has(absLine))              return `${prefix}${gutterSuffix ? gutterSuffix + " " : ""}${C.otherMatchFg}›${RESET} `;
    return `${prefix}${gutterSuffix}${pad}`;
  }

  function statusBar(w) {
    if (mode === "select") {
      const selStatus = selStart >= 0
        ? `${C.greenFg}selecting...${RESET}`
        : `${C.accentFg}move h/l${RESET}`;
      const hints = `${C.dim}  h/l move  Space mark  Enter annotate  Esc cancel${RESET}`;
      const left = `  ${C.matchFg}SELECT${RESET}  ${selStatus}`;
      const leftW = 9 + (selStart >= 0 ? 12 : 8);
      const hintsW = "  h/l move  Space mark  Enter annotate  Esc cancel".length;
      const gap = Math.max(1, w - leftW - hintsW - 1);
      return `${C.chromeBg}${left}${" ".repeat(gap)}${hints} ${RESET}`;
    }

    if (mode === "note") {
      const prompt  = `${C.matchFg}note:${RESET}`;
      const cursor  = `${C.rev} ${C.revOff}`;
      const nText   = noteInput + cursor;
      const hints   = `${C.dim}  Esc cancel  Enter save${RESET}`;
      const left    = ` ${prompt} ${nText}`;
      const leftW   = 7 + noteInput.length + 1;
      const hintsW  = "  Esc cancel  Enter save".length;
      const gap     = Math.max(1, w - leftW - hintsW - 1);
      return `${C.chromeBg}${left}${" ".repeat(gap)}${hints} ${RESET}`;
    }

    if (mode === "search") {
      const prompt  = `${C.accentFg}/${RESET}`;
      const cursor  = `${C.rev} ${C.revOff}`;
      const qText   = searchQuery + cursor;
      const count   = matchLines.length > 0
        ? `  ${C.greenFg}${matchLines.length} match${matchLines.length !== 1 ? "es" : ""}${RESET}`
        : searchQuery
        ? `  ${C.redFg}no matches${RESET}`
        : "";
      const hints   = `${C.dim}  Esc cancel  Enter jump${RESET}`;
      const left    = ` ${prompt} ${qText}${count}`;
      const leftW   = 3 + searchQuery.length + 1 + plain(count).length;
      const hintsW  = "  Esc cancel  Enter jump".length;
      const gap     = Math.max(1, w - leftW - hintsW - 1);
      return `${C.chromeBg}${left}${" ".repeat(gap)}${hints} ${RESET}`;
    }

    if (mode === "matches") {
      const q      = `${C.matchFg}"${searchQuery}"${RESET}`;
      const pos    = `${C.dimFg}match ${matchIdx + 1} / ${matchLines.length}${RESET}`;
      const hints  = `${C.dim}  n next  N prev  Esc clear${RESET}`;
      const left   = `  ${q}  ${pos}`;
      const leftW  = 2 + searchQuery.length + 2 + 2 + `match ${matchIdx + 1} / ${matchLines.length}`.length;
      const hintsW = "  n next  N prev  Esc clear".length;
      const gap    = Math.max(1, w - leftW - hintsW - 1);
      return `${C.chromeBg}${left}${" ".repeat(gap)}${hints} ${RESET}`;
    }

    // Normal mode
    const end   = Math.min(offset + visible(), lines.length);
    const pct   = lines.length === 0 ? "100%" : Math.round((end / lines.length) * 100) + "%";

    if (toast) {
      const toastStr = `${C.greenFg} ✔ ${toast}${RESET}`;
      const right    = `${C.dimFg} ${pct} ${RESET}`;
      const rightW   = ` ${pct} `.length;
      const gap      = Math.max(0, w - (3 + toast.length) - rightW);
      return `${C.chromeBg}${toastStr}${" ".repeat(gap)}${right}${RESET}`;
    }

    // Show note tooltip when cursor is on a line with annotations
    if (noteLineMap.has(cursor)) {
      const lineNotes = noteLineMap.get(cursor);
      const tooltipParts = lineNotes.map(n => `${C.matchFg}${n.anchor}${RESET}${C.dimFg}: ${n.text}${RESET}`);
      const tooltip = tooltipParts.join("  ");
      const tooltipPlain = lineNotes.map(n => `${n.anchor}: ${n.text}`).join("  ");
      const right = `${C.dimFg} ${pct} ${RESET}`;
      const rightW2 = ` ${pct} `.length;
      const maxTooltipW = w - 3 - rightW2;
      const truncTooltip = tooltipPlain.length > maxTooltipW
        ? tooltip.slice(0, maxTooltipW) + "..."
        : tooltip;
      const gap2 = Math.max(0, w - Math.min(tooltipPlain.length, maxTooltipW) - 2 - rightW2);
      return `${C.chromeBg} ${truncTooltip}${" ".repeat(gap2)}${right}${RESET}`;
    }

    const mouseHint = mouseEnabled ? "" : `${C.matchFg} [select mode]${RESET}`;
    const mouseW    = mouseEnabled ? 0 : " [select mode]".length;
    const noteCount = notes.length > 0 ? `${C.matchFg} ${notes.length}*${RESET}` : "";
    const noteW = notes.length > 0 ? ` ${notes.length}*`.length : 0;
    const hints  = `${C.dim} q  y  /  a  Tab  j k  space  g G  L  M${RESET}`;
    const right  = `${noteCount}${C.dimFg} ${pct} ${RESET}`;
    const hintsW = " q  y  /  a  Tab  j k  space  g G  L  M".length;
    const rightW = ` ${pct} `.length + noteW;
    const gap    = Math.max(0, w - hintsW - mouseW - rightW);
    return `${C.chromeBg}${hints}${mouseHint}${" ".repeat(gap)}${right}${RESET}`;
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────

  function showToast(msg, ms = 1500) {
    toast = msg;
    draw();
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast = ""; draw(); }, ms);
  }

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  function cleanup() {
    process.stdout.write(MOUSE_OFF + ALT_OFF + SHOW_CUR + RESET);
    process.stdin.setRawMode?.(false);
    process.exit(0);
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  process.stdin.on("data", (raw) => {
    const s = raw.toString();

    // Mouse SGR events: \x1B[<btn;col;row[Mm]
    const mouse = s.match(/\x1B\[<(\d+);(\d+);(\d+)([mM])/);
    if (mouse) {
      const btn = parseInt(mouse[1]);
      const mcol = parseInt(mouse[2]) - 1; // 0-based column
      const mrow = parseInt(mouse[3]) - 1; // 0-based row
      const isPress = mouse[4] === "M";

      // Scroll wheel
      if (btn === 64) { offset = Math.max(offset - 3, 0); cursor = Math.max(cursor, offset); draw(); return; }
      if (btn === 65) { offset = Math.min(offset + 3, maxOff()); cursor = Math.min(cursor, offset + visible() - 1); draw(); return; }

      // Left click (btn 0) — set cursor + enter select mode for annotation
      if (btn === 0 && isPress && mrow >= 1 && mrow < rows() - 1) {
        const absLine = offset + (mrow - 1);
        if (absLine < lines.length) {
          cursor = absLine;
          if (filePath && mode !== "note") {
            // Estimate char position (subtract gutter width)
            const gutterLen = lineNumbers ? totalDigits + 2 : 2;
            const charPos = Math.max(0, mcol - gutterLen);
            const curPlain = plain(lines[cursor] ?? "");
            selCol = Math.min(charPos, Math.max(0, curPlain.length - 1));
            selStart = selCol; selEnd = selCol;
            mode = "select";
          }
          draw();
        }
        return;
      }

      // Left drag (btn 32) — extend selection
      if (btn === 32 && mode === "select" && mrow >= 1 && mrow < rows() - 1) {
        const gutterLen = lineNumbers ? totalDigits + 2 : 2;
        const charPos = Math.max(0, mcol - gutterLen);
        const curPlain = plain(lines[cursor] ?? "");
        selCol = Math.min(charPos, Math.max(0, curPlain.length - 1));
        selEnd = selCol;
        draw();
        return;
      }

      // Left release (btn 0, m) — finalize selection, prompt for note
      if (btn === 0 && !isPress && mode === "select") {
        if (selStart >= 0 && selEnd >= 0 && selStart !== selEnd) {
          const curPlain = plain(lines[cursor] ?? "");
          const sMin = Math.min(selStart, selEnd);
          const sMax = Math.max(selStart, selEnd);
          selText = curPlain.slice(sMin, sMax + 1).trim();
          if (selText) {
            mode = "note"; noteInput = "";
            draw();
            return;
          }
        }
        // No selection made — just set cursor position
        mode = "normal"; selStart = -1; selEnd = -1;
        draw();
        return;
      }

      return;
    }

    // Select mode — character-level cursor for text selection
    if (mode === "select") {
      const curPlain = plain(lines[cursor] ?? "");
      const maxCol = Math.max(0, curPlain.length - 1);
      if (s === "\x1B" || s === "\x03") {
        mode = "normal"; selStart = -1; selEnd = -1; selCol = 0;
        draw(); return;
      }
      if (s === "h" || s === "\x1B[D") {
        selCol = Math.max(0, selCol - 1);
        if (selStart >= 0) selEnd = selCol;
        draw(); return;
      }
      if (s === "l" || s === "\x1B[C") {
        selCol = Math.min(maxCol, selCol + 1);
        if (selStart >= 0) selEnd = selCol;
        draw(); return;
      }
      if (s === " ") {
        if (selStart < 0) {
          // First press: mark start
          selStart = selCol; selEnd = selCol;
        } else {
          // Second press: finalize selection end
          selEnd = selCol;
        }
        draw(); return;
      }
      if (s === "\r" || s === "\n") {
        // Finalize selection and enter note mode
        if (selStart >= 0) {
          const sMin = Math.min(selStart, selEnd >= 0 ? selEnd : selStart);
          const sMax = Math.max(selStart, selEnd >= 0 ? selEnd : selStart);
          selText = curPlain.slice(sMin, sMax + 1).trim();
          if (selText) {
            mode = "note"; noteInput = "";
            draw(); return;
          }
        }
        mode = "normal"; selStart = -1; selEnd = -1;
        draw(); return;
      }
      return;
    }

    // Note mode — intercept all keystrokes for note text input
    if (mode === "note") {
      if (s === "\x1B" || s === "\x03") {
        mode = "normal"; noteInput = ""; selText = ""; selStart = -1; selEnd = -1;
        draw(); return;
      }
      if (s === "\r" || s === "\n") {
        if (noteInput.trim() && selText) {
          notes.push({
            anchor: selText,
            text: noteInput.trim(),
            lineHint: cursor,
            created: new Date().toISOString(),
          });
          rebuildNoteMap();
          saveFn(filePath, notes);
          showNotes = true;
          showToast("Note saved");
        }
        mode = "normal"; noteInput = ""; selText = ""; selStart = -1; selEnd = -1;
        draw(); return;
      }
      if (s === "\x7f" || s === "\x08") {
        noteInput = noteInput.slice(0, -1);
        draw(); return;
      }
      if (s.length === 1 && s >= " ") {
        noteInput += s;
        draw(); return;
      }
      return;
    }

    // Search mode — intercept all keystrokes
    if (mode === "search") {
      if (s === "\x1B" || s === "\x03") {
        mode = "normal"; searchQuery = ""; matchLines = []; matchSet = new Set();
        draw(); return;
      }
      if (s === "\r" || s === "\n") {
        mode = matchLines.length > 0 ? "matches" : "normal";
        if (mode === "normal") searchQuery = "";
        draw(); return;
      }
      if (s === "\x7f" || s === "\x08") {
        searchQuery = searchQuery.slice(0, -1);
        computeMatches(); draw(); return;
      }
      if (s.length === 1 && s >= " ") {
        searchQuery += s;
        computeMatches(); draw(); return;
      }
      return;
    }

    // Normal / matches mode
    let changed = true;
    switch (s) {
      case "q":
      case "\x03":
        return cleanup();

      case "j": case "\x1B[B":
        cursor = Math.min(cursor + 1, lines.length - 1);
        // Scroll if cursor goes below viewport
        if (cursor >= offset + visible()) offset = Math.min(offset + 1, maxOff());
        break;
      case "k": case "\x1B[A":
        cursor = Math.max(cursor - 1, 0);
        // Scroll if cursor goes above viewport
        if (cursor < offset) offset = Math.max(offset - 1, 0);
        break;

      case " ": case "f": case "\x1B[6~":
        offset = Math.min(offset + visible(), maxOff());
        cursor = Math.min(Math.max(cursor, offset), offset + visible() - 1);
        break;
      case "b": case "\x1B[5~":
        offset = Math.max(offset - visible(), 0);
        cursor = Math.max(Math.min(cursor, offset + visible() - 1), offset);
        break;

      case "d":
        offset = Math.min(offset + Math.floor(visible() / 2), maxOff());
        cursor = Math.min(Math.max(cursor, offset), offset + visible() - 1);
        break;
      case "u":
        offset = Math.max(offset - Math.floor(visible() / 2), 0);
        cursor = Math.max(Math.min(cursor, offset + visible() - 1), offset);
        break;

      case "g": offset = 0; cursor = 0; break;
      case "G": offset = maxOff(); cursor = lines.length - 1; break;

      case "y": {
        const text = lines.slice(offset, offset + visible()).map(plain).join("\n");
        copyText(text);
        showToast("Copied to clipboard"); return;
      }

      case "a": case "s": {
        if (!filePath) { showToast("Notes require a file (not stdin)"); return; }
        mode = "select"; selCol = 0; selStart = -1; selEnd = -1; selText = "";
        draw(); return;
      }

      case "x": {
        if (noteLineMap.has(cursor)) {
          const anchorsOnLine = noteLineMap.get(cursor).map(n => n.anchor);
          notes = notes.filter(n => !anchorsOnLine.includes(n.anchor));
          rebuildNoteMap();
          saveFn(filePath, notes);
          showToast("Note deleted");
        } else {
          changed = false;
        }
        break;
      }

      case "\t": // Tab — toggle inline notes
        showNotes = !showNotes;
        showToast(showNotes ? "Notes visible" : "Notes hidden"); return;

      case "L":
        lineNumbers = !lineNumbers;
        showToast(lineNumbers ? "Line numbers on" : "Line numbers off"); return;

      case "M":
        mouseEnabled = !mouseEnabled;
        process.stdout.write(mouseEnabled ? MOUSE_ON : MOUSE_OFF);
        showToast(mouseEnabled ? "Mouse scroll on" : "Mouse off — select text freely"); return;

      case "/": case "\x06": // Ctrl+F
        mode = "search"; searchQuery = ""; matchLines = []; matchSet = new Set();
        draw(); return;

      case "n":
        if (matchLines.length > 0) { scrollToMatch(matchIdx + 1); } else changed = false;
        break;
      case "N":
        if (matchLines.length > 0) { scrollToMatch(matchIdx - 1); } else changed = false;
        break;

      case "\x1B": // Esc — clear search from matches mode
        if (mode === "matches") {
          mode = "normal"; searchQuery = ""; matchLines = []; matchSet = new Set();
        } else { changed = false; }
        break;

      default:
        changed = false;
    }

    if (changed) draw();
  });

  // ─── Boot ──────────────────────────────────────────────────────────────────

  process.stdout.write(ALT_ON + HIDE_CUR);
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
  }

  draw();

  process.stdout.on("resize", () => {
    offset = Math.min(offset, maxOff());
    draw();
  });
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
