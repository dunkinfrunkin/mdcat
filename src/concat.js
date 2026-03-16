/**
 * Concatenate multiple file entries into a single markdown document.
 * Each entry is { name, content }. When there is more than one file,
 * a `## filename` heading and `---` separator are inserted between files.
 * Returns { title, content }.
 */
export function concatFiles(parts) {
  if (parts.length === 0) return { title: "", content: "" };
  if (parts.length === 1) return { title: parts[0].name, content: parts[0].content };
  return {
    title: `${parts.length} files`,
    content: parts
      .map(p => `## ${p.name}\n\n${p.content}`)
      .join("\n\n---\n\n"),
  };
}
