import { execSync } from "child_process";

/**
 * Detect whether the terminal is using a light or dark background.
 *
 * Checks (in order):
 *   1. MDCAT_THEME env var ("light" or "dark")
 *   2. COLORFGBG env var (e.g. "15;0" → dark, "0;15" → light)
 *   3. macOS Appearance via `defaults read`
 *   4. Falls back to "dark"
 */
export function detectTheme() {
  // 1. Explicit override
  const env = (process.env.MDCAT_THEME || "").toLowerCase();
  if (env === "light" || env === "dark") return env;

  // 2. COLORFGBG — "fg;bg" where bg >= 8 usually means light
  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const parts = colorfgbg.split(";");
    const bg = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(bg) && bg >= 8) return "light";
    if (!isNaN(bg) && bg < 8) return "dark";
  }

  // 3. macOS: check system appearance
  if (process.platform === "darwin") {
    try {
      const result = execSync(
        "defaults read -g AppleInterfaceStyle 2>/dev/null",
        { encoding: "utf8", timeout: 500 }
      ).trim();
      // "Dark" means dark mode; absence or error means light
      return result === "Dark" ? "dark" : "light";
    } catch {
      // Key missing → light mode on macOS
      return "light";
    }
  }

  return "dark";
}

/** Check CLI args for --light or --dark flags, returns the flag value or null. */
export function themeFromArgs(args) {
  if (args.includes("--light")) return "light";
  if (args.includes("--dark")) return "dark";
  return null;
}

/** Remove --light / --dark from an args array. */
export function stripThemeArgs(args) {
  return args.filter(a => a !== "--light" && a !== "--dark");
}
