import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.join(__dirname, "../src/content/blog");
const outPath = path.join(__dirname, "../src/data/blog.json");
const mediaOutDir = path.join(__dirname, "../public/blog");

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

// Configure marked for clean output
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * A post is either a single file (`my-post.md`) or a folder
 * (`my-post/index.md`) holding its media alongside it.
 */
function findPosts() {
  return fs
    .readdirSync(blogDir, { withFileTypes: true })
    .map((dirent) => {
      if (dirent.isFile() && dirent.name.endsWith(".md")) {
        return {
          slug: dirent.name.replace(/\.md$/, ""),
          mdPath: path.join(blogDir, dirent.name),
          mediaDir: null,
        };
      }
      if (dirent.isDirectory()) {
        const dir = path.join(blogDir, dirent.name);
        const mdPath = path.join(dir, "index.md");
        if (!fs.existsSync(mdPath)) return null;
        return { slug: dirent.name, mdPath, mediaDir: dir };
      }
      return null;
    })
    .filter(Boolean);
}

/** Copy every non-markdown file in a post folder to public/blog/<slug>/. */
function copyMedia({ slug, mediaDir }) {
  if (!mediaDir) return;

  const files = fs
    .readdirSync(mediaDir, { withFileTypes: true })
    .filter((d) => d.isFile() && !d.name.endsWith(".md") && !d.name.startsWith("."));
  if (files.length === 0) return;

  const dest = path.join(mediaOutDir, slug);
  fs.mkdirSync(dest, { recursive: true });
  for (const file of files) {
    fs.copyFileSync(path.join(mediaDir, file.name), path.join(dest, file.name));
  }
}

function mediaUrl(slug, file) {
  return `/blog/${encodeURIComponent(slug)}/${encodeURIComponent(file)}`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Obsidian-style embeds:
 *   ![[file.png]]             plain image
 *   ![[file.png|A caption]]   image with caption
 *   ![[file.png|400]]         image 400px wide
 *   ![[clip.mp4]]             video
 * Plus relative markdown images: ![alt](file.png)
 */
function rewriteMedia(markdown, post) {
  const withEmbeds = markdown.replace(
    /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g,
    (_, rawFile, rawOption) => {
      const file = rawFile.trim();
      const option = rawOption?.trim() ?? "";
      const src = mediaUrl(post.slug, file);

      if (post.mediaDir && !fs.existsSync(path.join(post.mediaDir, file))) {
        console.warn(`⚠️  ${post.slug}: missing media "${file}"`);
      }

      const isWidth = /^\d+$/.test(option);
      const caption = option && !isWidth ? escapeHtml(option) : "";
      const width = isWidth ? ` width="${option}"` : "";

      const media = VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase())
        ? `<video src="${src}" controls playsinline${width}></video>`
        : `<img src="${src}" alt="${caption}" loading="lazy"${width} />`;
      const figcaption = caption ? `<figcaption>${caption}</figcaption>` : "";

      return `\n\n<figure>${media}${figcaption}</figure>\n\n`;
    }
  );

  return withEmbeds.replace(
    /!\[([^\]]*)\]\((?!https?:|\/|#)([^)\s]+)\)/g,
    (_, alt, file) => `![${alt}](${mediaUrl(post.slug, decodeURIComponent(file))})`
  );
}

/**
 * Footnote citations:
 *   ...as shown by Mokhov et al.[^mokhov]
 *   [^mokhov]: Mokhov, Mitchell & Peyton Jones. [Build Systems à la Carte](https://...). ICFP 2018.
 * References are numbered by first use and collected at the end of the post.
 */
function extractFootnotes(markdown) {
  const definitions = new Map();
  const body = markdown.replace(
    /^\[\^([^\]]+)\]:[ \t]+(.+)$/gm,
    (_, key, text) => {
      definitions.set(key, text.trim());
      return "";
    }
  );
  return { body, definitions };
}

function citeFootnotes(markdown, definitions, order, slug) {
  return markdown.replace(/\[\^([^\]]+)\]/g, (match, key) => {
    if (!definitions.has(key)) {
      console.warn(`${slug}: citation [^${key}] has no definition`);
      return match;
    }
    if (!order.includes(key)) order.push(key);
    const n = order.indexOf(key) + 1;
    return `<sup class="footnote-ref"><a href="#fn-${slug}-${n}" id="fnref-${slug}-${n}">${n}</a></sup>`;
  });
}

function renderFootnotes(definitions, order, slug) {
  for (const key of definitions.keys()) {
    if (!order.includes(key)) {
      console.warn(`${slug}: footnote [^${key}] is defined but never cited`);
    }
  }

  if (order.length === 0) return "";

  const items = order
    .map((key, i) => {
      const n = i + 1;
      const text = marked.parseInline(definitions.get(key));
      return `<li id="fn-${slug}-${n}">${text}<a class="footnote-back" href="#fnref-${slug}-${n}" aria-label="Back to text">↩</a></li>`;
    })
    .join("");

  return `<section class="footnotes"><ol>${items}</ol></section>`;
}

/** Apply `transform` to prose only, leaving fenced code blocks untouched. */
function outsideCode(markdown, transform) {
  return markdown
    .split(/(^[ \t]*```[\s\S]*?^[ \t]*```)/m)
    .map((chunk, i) => (i % 2 === 1 ? chunk : transform(chunk)))
    .join("");
}

function renderBody(rawBody, post) {
  let markdown = outsideCode(rawBody, (chunk) => rewriteMedia(chunk, post));

  // Definitions are pulled out first so their own text isn't treated as a citation.
  const definitions = new Map();
  markdown = outsideCode(markdown, (chunk) => {
    const extracted = extractFootnotes(chunk);
    for (const [key, text] of extracted.definitions) definitions.set(key, text);
    return extracted.body;
  });

  const order = [];
  markdown = outsideCode(markdown, (chunk) =>
    citeFootnotes(chunk, definitions, order, post.slug)
  );

  return marked.parse(markdown) + renderFootnotes(definitions, order, post.slug);
}

function generateBlog() {
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  fs.rmSync(mediaOutDir, { recursive: true, force: true });

  const entries = findPosts()
    .map((post) => {
      const content = fs.readFileSync(post.mdPath, "utf-8");

      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) return null;

      const frontmatter = match[1];
      const rawBody = match[2].trim();

      const titleMatch = frontmatter.match(/title:\s+(.*)/);
      const dateMatch = frontmatter.match(/date:\s+(.*)/);

      const title = titleMatch
        ? titleMatch[1].replace(/^["']|["']$/g, "")
        : "Untitled";
      const date = dateMatch ? dateMatch[1].trim() : "1970-01-01";

      copyMedia(post);

      // Convert markdown to HTML at build time
      const body = renderBody(rawBody, post);

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
