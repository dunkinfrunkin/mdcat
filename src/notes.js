import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";
import { homedir } from "os";
import { join } from "path";

const NOTES_DIR = join(homedir(), ".mdcat", "notes");

/** Get the notes file path for a given source file. */
function notesPath(filePath) {
  const hash = createHash("sha256").update(filePath).digest("hex").slice(0, 16);
  return join(NOTES_DIR, `${hash}.json`);
}

/**
 * Load notes for a file. Returns a Map<lineContent, note>.
 * Each note: { lineContent, lineNum, text, created }
 */
export function loadNotes(filePath) {
  if (!filePath) return new Map();
  const p = notesPath(filePath);
  if (!existsSync(p)) return new Map();
  try {
    const data = JSON.parse(readFileSync(p, "utf8"));
    const map = new Map();
    for (const note of data.notes ?? []) {
      map.set(note.lineContent, note);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Save notes for a file.
 * @param {string} filePath - Absolute path to the source file
 * @param {Map} notesMap - Map<lineContent, note>
 */
export function saveNotes(filePath, notesMap) {
  if (!filePath) return;
  mkdirSync(NOTES_DIR, { recursive: true });
  const data = {
    file: filePath,
    notes: [...notesMap.values()],
  };
  writeFileSync(notesPath(filePath), JSON.stringify(data, null, 2));
}

/**
 * Build a lookup from rendered line index to note text.
 * Matches by plain-text content of each rendered line against note lineContent keys.
 *
 * @param {string[]} lines - Rendered lines (with ANSI)
 * @param {Map} notesMap - Map<lineContent, note>
 * @param {function} stripFn - Function to strip ANSI from a line
 * @returns {Map<number, string>} - Map<lineIndex, noteText>
 */
export function mapNotesToRendered(lines, notesMap, stripFn) {
  if (!notesMap || notesMap.size === 0) return new Map();
  const result = new Map();
  for (let i = 0; i < lines.length; i++) {
    const plainLine = stripFn(lines[i]).trim();
    if (plainLine && notesMap.has(plainLine)) {
      result.set(i, notesMap.get(plainLine).text);
    }
  }
  return result;
}

/** Get the notes directory path (for testing). */
export function getNotesDir() {
  return NOTES_DIR;
}
