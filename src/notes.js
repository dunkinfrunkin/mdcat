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
 * Load notes for a file. Returns an array of notes.
 * Each note: { anchor, text, lineHint, created }
 * anchor = the specific text fragment being annotated
 */
export function loadNotes(filePath) {
  if (!filePath) return [];
  const p = notesPath(filePath);
  if (!existsSync(p)) return [];
  try {
    const data = JSON.parse(readFileSync(p, "utf8"));
    return data.notes ?? [];
  } catch {
    return [];
  }
}

/**
 * Save notes for a file.
 * @param {string} filePath - Absolute path to the source file
 * @param {Array} notes - Array of note objects
 */
export function saveNotes(filePath, notes) {
  if (!filePath) return;
  mkdirSync(NOTES_DIR, { recursive: true });
  const data = { file: filePath, notes };
  writeFileSync(notesPath(filePath), JSON.stringify(data, null, 2));
}

/**
 * Find which rendered lines contain which note anchors.
 * Returns a Map<lineIndex, Array<{anchor, text}>> for lines that have annotations.
 *
 * @param {string[]} lines - Rendered lines (with ANSI)
 * @param {Array} notes - Array of note objects with .anchor
 * @param {function} stripFn - Function to strip ANSI from a line
 * @returns {Map<number, Array<{anchor, text}>>}
 */
export function mapNotesToRendered(lines, notes, stripFn) {
  if (!notes || notes.length === 0) return new Map();
  const result = new Map();
  for (let i = 0; i < lines.length; i++) {
    const plainLine = stripFn(lines[i]);
    for (const note of notes) {
      if (plainLine.includes(note.anchor)) {
        if (!result.has(i)) result.set(i, []);
        result.get(i).push({ anchor: note.anchor, text: note.text });
      }
    }
  }
  return result;
}

/** Get the notes directory path (for testing). */
export function getNotesDir() {
  return NOTES_DIR;
}
