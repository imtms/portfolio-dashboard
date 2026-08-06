import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const directory = path.join(process.cwd(), "content", "articles");
const files = fs.readdirSync(directory).filter((name) => name.endsWith(".md"));
assert.ok(files.length > 0, "content/articles must contain at least one Markdown article");

const articles = files.map((fileName) => {
  const { data, content } = matter(fs.readFileSync(path.join(directory, fileName), "utf8"));
  assert.ok(data.title, `${fileName}: front matter title is required`);
  assert.ok(data.date, `${fileName}: front matter date is required`);
  assert.ok(data.summary, `${fileName}: front matter summary is required`);
  assert.ok(content.trim(), `${fileName}: article body must not be empty`);
  const normalizedDate = data.date instanceof Date ? data.date : String(data.date).trim();
  const date = normalizedDate instanceof Date ? normalizedDate : new Date(/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) ? `${normalizedDate}T00:00:00Z` : normalizedDate);
  assert.ok(!Number.isNaN(date.getTime()), `${fileName}: date must be YYYY-MM-DD`);
  return { fileName, date: date.toISOString().slice(0, 10) };
});

const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
assert.deepEqual(sorted.map((item) => item.date), articles.sort((a, b) => b.date.localeCompare(a.date)).map((item) => item.date));
console.log(`Validated ${files.length} Markdown article(s): ${sorted.map((item) => item.fileName).join(", ")}`);
