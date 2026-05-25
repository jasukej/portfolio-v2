import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.join(__dirname, "../src/content/blog");
const outPath = path.join(__dirname, "../src/data/blog.json");

function generateBlog() {
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  const files = fs.readdirSync(blogDir).filter((file) => file.endsWith(".md"));

  const entries = files
    .map((file) => {
      const content = fs.readFileSync(path.join(blogDir, file), "utf-8");

      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) return null;

      const frontmatter = match[1];
      const body = match[2].trim();

      const titleMatch = frontmatter.match(/title:\s+(.*)/);
      const dateMatch = frontmatter.match(/date:\s+(.*)/);

      const title = titleMatch
        ? titleMatch[1].replace(/^["']|["']$/g, "")
        : "Untitled";
      const date = dateMatch ? dateMatch[1].trim() : "1970-01-01";

      return { title, date, body };
    })
    .filter(Boolean);

  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2), "utf-8");
  console.log(
    `✅ Generated ${entries.length} blog posts → ${outPath}`
  );
}

generateBlog();
