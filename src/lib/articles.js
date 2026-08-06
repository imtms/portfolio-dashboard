import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const articlesDirectory = path.join(process.cwd(), "content", "articles");

function toIsoDate(value, fileName) {
  const normalized = value instanceof Date ? value : String(value).trim();
  const date = normalized instanceof Date ? normalized : new Date(/^\d{4}-\d{2}-\d{2}$/.test(normalized) ? `${normalized}T00:00:00Z` : normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Article ${fileName} has an invalid date`);
  }
  return date.toISOString().slice(0, 10);
}

function readingTime(content) {
  const latinWords = (content.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
  const cjkCharacters = (content.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  return Math.max(1, Math.ceil((latinWords + cjkCharacters) / 320));
}

function excerptFrom(content) {
  const plainText = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#|~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${plainText.slice(0, 132).trim()}${plainText.length > 132 ? "…" : ""}`;
}

function readArticle(fileName) {
  const slug = fileName.replace(/\.md$/, "");
  const source = fs.readFileSync(path.join(articlesDirectory, fileName), "utf8");
  const { data, content } = matter(source);

  if (!data.title) throw new Error(`Article ${fileName} is missing a title`);
  if (!data.date) throw new Error(`Article ${fileName} is missing a date`);

  return {
    slug,
    title: String(data.title),
    date: toIsoDate(data.date, fileName),
    summary: data.summary ? String(data.summary) : excerptFrom(content),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingMinutes: readingTime(content),
    content,
  };
}

export function getAllArticles() {
  if (!fs.existsSync(articlesDirectory)) return [];

  return fs
    .readdirSync(articlesDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map(readArticle)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export function getArticleBySlug(slug) {
  if (!/^[a-zA-Z0-9-_]+$/.test(slug)) return null;
  const fileName = `${slug}.md`;
  if (!fs.existsSync(path.join(articlesDirectory, fileName))) return null;
  return readArticle(fileName);
}
