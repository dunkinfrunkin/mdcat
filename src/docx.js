import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ExternalHyperlink, TabStopPosition, TabStopType,
  ShadingType, TableLayoutType, Footer, Header,
} from "docx";

// ─── Colors (Word-native blues/grays) ──────────────────────────────────────

const COLOR = {
  heading1:   "1F3864",  // dark navy
  heading2:   "2E74B5",  // medium blue
  heading3:   "2E74B5",
  heading4:   "404040",
  link:       "2E74B5",
  code:       "D63384",  // magenta for inline code
  codeBg:     "F6F8FA",
  tableHeader:"2E74B5",
  tableHeaderBg: "D9E2F3",
  tableAltBg: "F2F2F2",
  tableBorder:"BFBFBF",
  blockquoteBorder: "2E74B5",
  blockquoteText: "595959",
  taskGreen:  "2D8A4E",
  taskGray:   "999999",
  body:       "333333",
  muted:      "808080",
};

// ─── Inline token → TextRun[] / ExternalHyperlink[] ─────────────────────────

function inlineRuns(tokens, opts = {}) {
  if (!tokens?.length) return [];
  const runs = [];

  for (const tok of tokens) {
    switch (tok.type) {
      case "text":
        if (tok.tokens) {
          runs.push(...inlineRuns(tok.tokens, opts));
        } else {
          runs.push(new TextRun({ text: htmlDecode(tok.text ?? ""), color: COLOR.body, ...opts }));
        }
        break;
      case "strong":
        runs.push(...inlineRuns(tok.tokens, { ...opts, bold: true }));
        break;
      case "em":
        runs.push(...inlineRuns(tok.tokens, { ...opts, italics: true }));
        break;
      case "del":
        runs.push(...inlineRuns(tok.tokens, { ...opts, strike: true, color: COLOR.muted }));
        break;
      case "codespan":
        runs.push(new TextRun({
          text: tok.text ?? "",
          font: "Consolas",
          size: 20,
          color: COLOR.code,
          shading: { type: ShadingType.CLEAR, fill: COLOR.codeBg },
          ...opts,
        }));
        break;
      case "link": {
        // Recursively get inline runs for the link label to preserve bold/italic/etc
        const labelRuns = tok.tokens?.length
          ? inlineRuns(tok.tokens, { ...opts, color: COLOR.link, underline: { type: "single" } })
          : [new TextRun({ text: tok.href ?? "", color: COLOR.link, underline: { type: "single" }, ...opts })];
        runs.push(new ExternalHyperlink({
          children: labelRuns,
          link: tok.href ?? "",
        }));
        break;
      }
      case "image":
        runs.push(new TextRun({
          text: `[${tok.text || tok.alt || "image"}]`,
          italics: true,
          color: COLOR.muted,
          ...opts,
        }));
        break;
      case "br":
        runs.push(new TextRun({ break: 1 }));
        break;
      case "escape":
        runs.push(new TextRun({ text: tok.text ?? "", color: COLOR.body, ...opts }));
        break;
      default:
        if (tok.raw) runs.push(new TextRun({ text: tok.raw, color: COLOR.body, ...opts }));
        break;
    }
  }

  return runs;
}

// ─── HTML entity decoder ────────────────────────────────────────────────────

function htmlDecode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ─── Block token → Paragraph[] ──────────────────────────────────────────────

function blockToParagraphs(tok) {
  const out = [];

  switch (tok.type) {
    case "heading": {
      const headingMap = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      const colorMap = {
        1: COLOR.heading1,
        2: COLOR.heading2,
        3: COLOR.heading3,
        4: COLOR.heading4,
        5: COLOR.heading4,
        6: COLOR.muted,
      };
      const runs = inlineRuns(tok.tokens).map(r => {
        // Override color for heading runs
        if (r instanceof TextRun) {
          return new TextRun({
            ...extractRunProps(r),
            color: colorMap[tok.depth] ?? COLOR.body,
          });
        }
        return r;
      });

      out.push(new Paragraph({
        heading: headingMap[tok.depth] ?? HeadingLevel.HEADING_1,
        children: runs,
        spacing: { before: 240, after: 120 },
        ...(tok.depth <= 2 ? {
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9", space: 4 } },
        } : {}),
      }));
      break;
    }

    case "paragraph":
      out.push(new Paragraph({
        children: inlineRuns(tok.tokens),
        spacing: { after: 160, line: 300 },
      }));
      break;

    case "code": {
      const lang = (tok.lang ?? "").split(/\s/)[0].trim();
      const lines = (tok.text ?? "").split("\n");

      // Language label
      if (lang) {
        out.push(new Paragraph({
          children: [new TextRun({
            text: lang.toUpperCase(),
            font: "Consolas",
            size: 16,
            color: COLOR.muted,
            bold: true,
          })],
          spacing: { before: 200, after: 40 },
        }));
      } else {
        out.push(new Paragraph({ spacing: { before: 120 } }));
      }

      // Code lines in a shaded block
      for (let i = 0; i < lines.length; i++) {
        out.push(new Paragraph({
          children: [new TextRun({
            text: lines[i] || " ",
            font: "Consolas",
            size: 19,
            color: COLOR.body,
          })],
          shading: { type: ShadingType.CLEAR, fill: COLOR.codeBg },
          spacing: { after: 0, line: 260 },
          indent: { left: 240, right: 240 },
          ...(i === 0 ? { border: { top: { style: BorderStyle.SINGLE, size: 1, color: "E1E4E8", space: 4 } } } : {}),
          ...(i === lines.length - 1 ? { border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E1E4E8", space: 4 } } } : {}),
        }));
      }
      out.push(new Paragraph({ spacing: { after: 160 } }));
      break;
    }

    case "blockquote": {
      for (const t of tok.tokens ?? []) {
        if (t.tokens) {
          const children = inlineRuns(t.tokens).map(r => {
            if (r instanceof TextRun) {
              return new TextRun({ ...extractRunProps(r), color: COLOR.blockquoteText, italics: true });
            }
            return r;
          });
          out.push(new Paragraph({
            children,
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR.blockquoteBorder, space: 12 } },
            spacing: { after: 80, line: 280 },
          }));
        } else if (t.type === "paragraph" && t.tokens) {
          const children = inlineRuns(t.tokens).map(r => {
            if (r instanceof TextRun) {
              return new TextRun({ ...extractRunProps(r), color: COLOR.blockquoteText, italics: true });
            }
            return r;
          });
          out.push(new Paragraph({
            children,
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLOR.blockquoteBorder, space: 12 } },
            spacing: { after: 80, line: 280 },
          }));
        }
      }
      out.push(new Paragraph({ spacing: { after: 80 } }));
      break;
    }

    case "list": {
      const items = tok.items ?? [];
      items.forEach((item, i) => {
        const children = [];

        if (item.task) {
          const checked = item.checked;
          children.push(new TextRun({
            text: checked ? "✓ " : "○ ",
            font: "Segoe UI Symbol",
            color: checked ? COLOR.taskGreen : COLOR.taskGray,
            bold: checked,
          }));
        }

        for (const t of item.tokens) {
          if (t.type === "text") {
            const taskDone = item.task && item.checked;
            children.push(...inlineRuns(
              t.tokens ?? [{ type: "text", text: t.text ?? "" }],
              taskDone ? { strike: true, color: COLOR.muted } : {},
            ));
          } else if (t.type === "paragraph") {
            const taskDone = item.task && item.checked;
            children.push(...inlineRuns(
              t.tokens,
              taskDone ? { strike: true, color: COLOR.muted } : {},
            ));
          } else if (t.type === "list") {
            // handled below
          }
        }

        const bullet = tok.ordered
          ? new TextRun({ text: `${(tok.start ?? 1) + i}.  `, color: COLOR.heading2, bold: true })
          : new TextRun({ text: item.task ? "" : "•  ", color: COLOR.heading2 });

        out.push(new Paragraph({
          children: [bullet, ...children],
          indent: { left: 360 },
          spacing: { after: 60, line: 276 },
        }));

        // Nested lists
        for (const t of item.tokens) {
          if (t.type === "list") {
            const nested = blockToParagraphs(t);
            for (const p of nested) {
              out.push(new Paragraph({
                ...extractParaProps(p),
                indent: { left: 720 },
                spacing: { after: 60, line: 276 },
              }));
            }
          }
        }
      });
      out.push(new Paragraph({ spacing: { after: 80 } }));
      break;
    }

    case "table": {
      const headers = tok.header ?? [];
      const rows = tok.rows ?? [];
      const aligns = tok.align ?? [];

      const alignMap = {
        left: AlignmentType.LEFT,
        right: AlignmentType.RIGHT,
        center: AlignmentType.CENTER,
      };

      const cellBorder = {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLOR.tableBorder },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR.tableBorder },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLOR.tableBorder },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLOR.tableBorder },
      };

      // Compute column widths from content
      const colWidths = headers.map((h, i) => {
        const hLen = (h.tokens ?? []).map(t => t.text ?? t.raw ?? "").join("").length;
        const maxCell = rows.reduce((m, r) => {
          const cLen = (r[i]?.tokens ?? []).map(t => t.text ?? t.raw ?? "").join("").length;
          return Math.max(m, cLen);
        }, 0);
        return Math.max(hLen, maxCell, 3);
      });
      const totalW = colWidths.reduce((s, w) => s + w, 0) || 1;
      const colPcts = colWidths.map(w => Math.max(8, Math.round((w / totalW) * 100)));

      // Header row
      const headerCells = headers.map((h, i) => new TableCell({
        children: [new Paragraph({
          children: inlineRuns(h.tokens ?? []).map(r => {
            if (r instanceof TextRun) {
              return new TextRun({ ...extractRunProps(r), bold: true, color: "FFFFFF" });
            }
            return r;
          }),
          alignment: alignMap[aligns[i]] ?? AlignmentType.LEFT,
          spacing: { before: 40, after: 40 },
        })],
        width: { size: colPcts[i], type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: COLOR.tableHeader },
        borders: cellBorder,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
      }));

      const tableRows = [new TableRow({ children: headerCells, tableHeader: true })];

      // Data rows with alternating shading
      rows.forEach((row, rowIdx) => {
        const cells = row.map((cell, i) => new TableCell({
          children: [new Paragraph({
            children: inlineRuns(cell.tokens ?? []),
            alignment: alignMap[aligns[i]] ?? AlignmentType.LEFT,
            spacing: { before: 20, after: 20 },
          })],
          width: { size: colPcts[i], type: WidthType.PERCENTAGE },
          shading: rowIdx % 2 === 1
            ? { type: ShadingType.CLEAR, fill: COLOR.tableAltBg }
            : undefined,
          borders: cellBorder,
          margins: { top: 20, bottom: 20, left: 80, right: 80 },
        }));
        tableRows.push(new TableRow({ children: cells }));
      });

      out.push(new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: colPcts.map(p => Math.round(p * 90)),
      }));
      out.push(new Paragraph({ spacing: { after: 200 } }));
      break;
    }

    case "hr":
      out.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9D9D9" } },
        spacing: { before: 240, after: 240 },
      }));
      break;

    case "space":
    case "html":
    case "def":
      break;

    default:
      break;
  }

  return out;
}

// ─── Helpers to extract properties from existing objects ─────────────────────

function extractRunProps(run) {
  // TextRun stores props internally; we reconstruct from the XML root
  const props = {};
  const root = run.root;
  if (!root) return props;

  // Walk the internal representation to pull out text and formatting
  // This is a simplified extraction — we pass through common props
  for (const child of root) {
    if (typeof child === "string") continue;
    if (child?.rootKey === "w:t") {
      props.text = child.root?.[1] ?? "";
    }
    if (child?.rootKey === "w:rPr") {
      for (const pr of child.root ?? []) {
        if (pr?.rootKey === "w:b") props.bold = true;
        if (pr?.rootKey === "w:i") props.italics = true;
        if (pr?.rootKey === "w:strike") props.strike = true;
        if (pr?.rootKey === "w:color") {
          const val = pr.root?.find(a => a?.rootKey === "w:val" || a?._attr?.["w:val"]);
          if (val?._attr?.["w:val"]) props.color = val._attr["w:val"];
        }
        if (pr?.rootKey === "w:rFonts") {
          const val = pr.root?.find(a => a?._attr?.["w:ascii"]);
          if (val?._attr?.["w:ascii"]) props.font = val._attr["w:ascii"];
        }
        if (pr?.rootKey === "w:sz") {
          const val = pr.root?.find(a => a?._attr?.["w:val"]);
          if (val?._attr?.["w:val"]) props.size = parseInt(val._attr["w:val"]);
        }
      }
    }
  }
  return props;
}

function extractParaProps(para) {
  // Return a minimal representation for re-creating paragraphs
  return {
    children: para.root?.[1]?.root?.filter(r => r instanceof TextRun || r instanceof ExternalHyperlink) ?? [],
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Convert marked tokens to a .docx buffer.
 */
export async function toDocx(tokens, title = "Document") {
  const children = tokens.flatMap(tok => blockToParagraphs(tok));

  const doc = new Document({
    title,
    styles: {
      default: {
        document: {
          run: { size: 24, font: "Calibri", color: COLOR.body },
          paragraph: { spacing: { after: 160, line: 300 } },
        },
        heading1: {
          run: { size: 36, font: "Calibri", bold: true, color: COLOR.heading1 },
          paragraph: { spacing: { before: 360, after: 120 } },
        },
        heading2: {
          run: { size: 30, font: "Calibri", bold: true, color: COLOR.heading2 },
          paragraph: { spacing: { before: 280, after: 100 } },
        },
        heading3: {
          run: { size: 26, font: "Calibri", bold: true, color: COLOR.heading3 },
          paragraph: { spacing: { before: 240, after: 80 } },
        },
        heading4: {
          run: { size: 24, font: "Calibri", bold: true, color: COLOR.heading4 },
          paragraph: { spacing: { before: 200, after: 80 } },
        },
        heading5: {
          run: { size: 22, font: "Calibri", italics: true, color: COLOR.heading4 },
          paragraph: { spacing: { before: 160, after: 60 } },
        },
        heading6: {
          run: { size: 22, font: "Calibri", color: COLOR.muted },
          paragraph: { spacing: { before: 160, after: 60 } },
        },
        hyperlink: {
          run: { color: COLOR.link, underline: { type: "single" } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Created with ", color: COLOR.muted, size: 16, font: "Calibri" }),
              new ExternalHyperlink({
                children: [new TextRun({
                  text: "mdcat",
                  color: COLOR.link,
                  underline: { type: "single" },
                  size: 16,
                  font: "Calibri",
                })],
                link: "https://mdcat.frankchan.dev",
              }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}
