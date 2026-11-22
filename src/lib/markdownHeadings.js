export function slugifyHeading(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[`*_~[\]()<>]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 72) || "section";
}

export function createHeadingIdGenerator() {
  const counts = new Map();
  return (text) => {
    const base = slugifyHeading(text);
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

export function extractTextFromNode(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join("");
  if (typeof node === "object" && node.props) {
    return extractTextFromNode(node.props.children);
  }
  return "";
}

export function extractMarkdownHeadings(markdown, { minLevel = 2, maxLevel = 3 } = {}) {
  if (!markdown) return [];
  const nextId = createHeadingIdGenerator();
  const headings = [];
  let inCodeBlock = false;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(trimmed);
    if (!match) continue;
    const level = match[1].length;
    if (level < minLevel || level > maxLevel) continue;

    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[`*_~]/g, "")
      .trim();
    if (!text) continue;

    headings.push({
      id: nextId(text),
      level,
      text,
    });
  }

  return headings;
}
