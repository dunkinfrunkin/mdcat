import { execFileSync } from "child_process";
import { dirname } from "path";

/**
 * Parse unified diff output into a Map of source line numbers to change types.
 *
 * Change types:
 *   "added"    — line exists only in the working copy
 *   "modified" — line was changed (deletion + addition at the same position)
 *   "deleted"  — a deletion occurred at or just before this line
 *
 * @param {string} diffOutput - raw unified diff text (from `git diff`)
 * @returns {Map<number, string>} lineNumber (1-based) → "added" | "modified" | "deleted"
 */
export function parseDiff(diffOutput) {
  const map = new Map();
  if (!diffOutput) return map;

  const lines = diffOutput.split("\n");
  let newLine = 0; // current line number in the new (working) file

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse hunk header: @@ -oldstart,oldcount +newstart,newcount @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      const oldStart = parseInt(hunkMatch[1], 10);
      const oldCount = hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1;
      const newStart = parseInt(hunkMatch[3], 10);
      const newCount = hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1;

      newLine = newStart;

      // Walk through hunk body lines
      let j = i + 1;
      let curNew = newStart;
      let curOld = oldStart;

      while (j < lines.length && !lines[j].startsWith("@@") && !lines[j].startsWith("diff ")) {
        const hLine = lines[j];

        if (hLine.startsWith("---") || hLine.startsWith("+++")) {
          j++;
          continue;
        }

        if (hLine.startsWith("-")) {
          // Deletion — look ahead to see if the next line is an addition (modification)
          let k = j + 1;
          // Peek ahead: if the next non-delete line is a +, this is a modification
          if (k < lines.length && lines[k].startsWith("+")) {
            // This is a modification: the + line replaces the - line
            map.set(curNew, "modified");
            curOld++;
            curNew++;
            j = k + 1; // skip both - and + lines
            continue;
          }
          // Pure deletion — mark the current new-file line
          // If curNew hasn't gone past the file, mark it as a deletion point
          if (!map.has(curNew)) {
            map.set(curNew, "deleted");
          }
          curOld++;
          j++;
          continue;
        }

        if (hLine.startsWith("+")) {
          // Pure addition
          map.set(curNew, "added");
          curNew++;
          j++;
          continue;
        }

        // Context line (starts with space or is empty after diff markers)
        curNew++;
        curOld++;
        j++;
      }

      // Advance outer loop past the hunk body we just consumed
      i = j - 1;
      continue;
    }
  }

  return map;
}

/**
 * Check whether a file is tracked by git.
 *
 * @param {string} filePath - absolute path to the file
 * @returns {boolean}
 */
function isTracked(filePath) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", filePath], {
      cwd: dirname(filePath),
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether a path is inside a git repository.
 *
 * @param {string} filePath - absolute path to the file
 * @returns {boolean}
 */
function isGitRepo(filePath) {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: dirname(filePath),
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a diff map for a file, mapping source line numbers to change types.
 *
 * Handles:
 * - Not a git repo: returns empty map
 * - Untracked file: returns map with every line marked "added"
 * - Tracked file with changes: parses `git diff HEAD -- <file>`
 * - Tracked file with no changes: returns empty map
 *
 * @param {string} filePath - absolute path to the file
 * @param {number} totalLines - total number of lines in the file
 * @returns {Map<number, string>} lineNumber (1-based) → "added" | "modified" | "deleted"
 */
export function getDiffMap(filePath, totalLines) {
  if (!isGitRepo(filePath)) {
    return new Map();
  }

  if (!isTracked(filePath)) {
    // Untracked file — everything is "added"
    const map = new Map();
    for (let i = 1; i <= totalLines; i++) {
      map.set(i, "added");
    }
    return map;
  }

  try {
    const diff = execFileSync("git", ["diff", "HEAD", "--", filePath], {
      cwd: dirname(filePath),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return parseDiff(diff);
  } catch {
    return new Map();
  }
}

/**
 * Map source-file diff markers to rendered output lines using proportional mapping.
 *
 * Since markdown rendering changes the line count (headings become boxes, code blocks
 * get borders, etc.), we use a proportional mapping from source lines to rendered lines.
 *
 * @param {Map<number, string>} sourceDiffMap - from getDiffMap (1-based source lines)
 * @param {number} sourceLineCount - total lines in the source file
 * @param {number} renderedLineCount - total lines in the rendered output
 * @returns {Map<number, string>} renderedLineIndex (0-based) → "added" | "modified" | "deleted"
 */
export function mapDiffToRendered(sourceDiffMap, sourceLineCount, renderedLineCount) {
  const rendered = new Map();
  if (sourceDiffMap.size === 0 || sourceLineCount === 0 || renderedLineCount === 0) {
    return rendered;
  }

  for (const [srcLine, type] of sourceDiffMap) {
    // Proportional mapping: source line 1..N → rendered line 0..(M-1)
    const ratio = (srcLine - 1) / Math.max(sourceLineCount - 1, 1);
    const renderedLine = Math.round(ratio * (renderedLineCount - 1));
    const clamped = Math.max(0, Math.min(renderedLine, renderedLineCount - 1));

    // If a line already has a stronger marker, keep it
    // Priority: modified > added > deleted
    const existing = rendered.get(clamped);
    if (!existing || priority(type) > priority(existing)) {
      rendered.set(clamped, type);
    }
  }

  return rendered;
}

function priority(type) {
  if (type === "modified") return 3;
  if (type === "added") return 2;
  if (type === "deleted") return 1;
  return 0;
}
