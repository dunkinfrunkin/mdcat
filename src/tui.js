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

// One Dark-aligned color palette (24-bit ANSI)
const C = {
  chromeBg:    `${ESC}[48;2;33;37;43m`,    // #21252b  — top/bottom chrome bg
  badge:       `${ESC}[38;2;198;120;221m`,  // #c678dd  — purple badge
  titleFg:     `${ESC}[97m`,                // bright white — filename
  dimFg:       `${ESC}[38;2;92;99;112m`,   // #5c6370  — dim hints / app name
  accentFg:    `${ESC}[38;2;97;175;239m`,  // #61afef  — blue search prompt
  matchFg:     `${ESC}[38;2;229;192;123m`, // #e5c07b  — gold current match
  greenFg:     `${ESC}[38;2;152;195;121m`, // #98c379  — match count
  redFg:       `${ESC}[38;2;224;108;117m`, // #e06c75  — no matches
  otherMatchFg:`${ESC}[38;2;92;99;112m`,   // #5c6370  — other match gutter
  bold:        `${ESC}[1m`,
  dim:         `${ESC}[2m`,
  italic:      `${ESC}[3m`,
  rev:         `${ESC}[7m`,
  revOff:      `${ESC}[27m`,
};

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
const HL_MATCH   = `${ESC}[48;2;62;68;82m${ESC}[38;2;229;192;123m`; // other matches
const HL_CURRENT = `${ESC}[48;2;229;192;123m${ESC}[38;2;0;0;0m`;    // current match
const HL_OFF     = `${ESC}[49m${ESC}[39m`;

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

export function launch(title, lines) {
  // Viewport state
  let offset = 0;

  // Search state
  let mode        = "normal";   // "normal" | "search" | "matches"
  let searchQuery = "";
  let matchLines  = [];         // sorted array of line indices with matches
  let matchSet    = new Set();  // for O(1) gutter lookup
  let matchIdx    = 0;

  // Mouse / clipboard state
  let mouseEnabled = true;
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

    // Rows 2..h-1: content with optional gutter + search highlighting
    const slice = lines.slice(offset, offset + visible());
    for (let i = 0; i < visible(); i++) {
      const absLine = offset + i;
      const gutter  = gutterFor(absLine);
      let   content = slice[i] ?? "";
      if (searchQuery && matchSet.has(absLine)) {
        content = highlightInLine(content, searchQuery, matchLines[matchIdx] === absLine);
      }
      out.push(move(i + 2, 1) + ERASE_L + gutter + content);
    }

    // Row h: status / search bar
    out.push(move(h, 1) + ERASE_L + statusBar(w));

    // Show cursor only in search mode (for the text input)
    out.push(mode === "search" ? SHOW_CUR : HIDE_CUR);

    process.stdout.write(out.join(""));
  }

  // ─── Chrome helpers ────────────────────────────────────────────────────────

  function topBar(title, w) {
    const ext   = /\.(md|markdown|mdx)$/i.test(title) ? "md" : "~";
    const badge = `${C.badge}[${ext}]${RESET}${C.chromeBg}`;
    const left  = ` ${badge} ${C.bold}${C.titleFg}${title}${RESET}${C.chromeBg}`;
    const right = `${C.dimFg}mdcat ${RESET}`;
    const leftW = 1 + ext.length + 2 + 1 + title.length + 1;
    const rightW = "mdcat ".length;
    const gap   = Math.max(0, w - leftW - rightW);
    return `${C.chromeBg}${left}${C.dimFg}${" ".repeat(gap)}${right}${RESET}`;
  }

  function gutterFor(absLine) {
    if (mode === "normal" || !searchQuery) return "  ";
    if (matchLines[matchIdx] === absLine)   return `${C.matchFg}▶${RESET} `;
    if (matchSet.has(absLine))              return `${C.otherMatchFg}›${RESET} `;
    return "  ";
  }

  function statusBar(w) {
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

    const mouseHint = mouseEnabled ? "" : `${C.matchFg} [select mode]${RESET}`;
    const mouseW    = mouseEnabled ? 0 : " [select mode]".length;
    const hints  = `${C.dim} q  y  /  j k  ↑↓  space  g G${RESET}`;
    const right  = `${C.dimFg} ${pct} ${RESET}`;
    const hintsW = " q  y  /  j k  ↑↓  space  g G".length;
    const rightW = ` ${pct} `.length;
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

    // Mouse SGR events: \x1B[<btn;col;rowm
    // SGR mouse: ESC[<btn;col;rowM (press) or ESC[<btn;col;rowm (release)
    // Scroll wheel sends press events (M), so match both m and M
    const mouse = s.match(/\x1B\[<(\d+);\d+;\d+[mM]/);
    if (mouse) {
      const btn = parseInt(mouse[1]);
      if (btn === 64) { offset = Math.max(offset - 3, 0);        draw(); }
      if (btn === 65) { offset = Math.min(offset + 3, maxOff()); draw(); }
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
        offset = Math.min(offset + 1, maxOff()); break;
      case "k": case "\x1B[A":
        offset = Math.max(offset - 1, 0); break;

      case " ": case "f": case "\x1B[6~":
        offset = Math.min(offset + visible(), maxOff()); break;
      case "b": case "\x1B[5~":
        offset = Math.max(offset - visible(), 0); break;

      case "d":
        offset = Math.min(offset + Math.floor(visible() / 2), maxOff()); break;
      case "u":
        offset = Math.max(offset - Math.floor(visible() / 2), 0); break;

      case "g": offset = 0;        break;
      case "G": offset = maxOff(); break;

      case "y": {
        const text = lines.slice(offset, offset + visible()).map(plain).join("\n");
        copyText(text);
        showToast("Copied to clipboard"); return;
      }

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

  process.stdout.write(ALT_ON + HIDE_CUR + MOUSE_ON);
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
