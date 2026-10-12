import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";
import { bundledLanguages, createHighlighter } from "shiki";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, "../src/content");
const dataDir = path.join(__dirname, "../src/data");
const publicDir = path.join(__dirname, "../public");

/**
 * Each collection is a folder of markdown under src/content/<name>/, rendered
 * through the same pipeline; media is served from public/<name>/<slug>/.
 */
const COLLECTIONS = [
  {
    name: "blog",
    outFile: "blog.json",
    // Newest first, shown as a list in the blog window.
    output: (entries) =>
      entries
        .map(({ title, date, body }) => ({ title, date, body }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  },
  {
    name: "experiences",
    outFile: "experience-writeups.json",
    // Keyed by folder name, which an experiences.json entry names as its `writeup`.
    output: (entries) =>
      Object.fromEntries(entries.map(({ slug, title, body }) => [slug, { title, body }])),
  },
];

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

// macOS screenshot names put a narrow no-break space before "AM"/"PM", which
// looks identical to a normal space when typed into markdown.
const normalizeFileName = (name) => name.replace(/[\u00a0\u202f]/g, " ");

// Configure marked for clean output
marked.setOptions({
  breaks: true,
  gfm: true,
});

/**
 * Fenced code is highlighted at build time with Shiki. Both themes are emitted
 * as CSS variables (--shiki-light / --shiki-dark) so globals.css can follow the
 * site's `.dark` class; languages are loaded on demand from the fences found.
 */
const highlighter = await createHighlighter({
  themes: ["github-light", "github-dark-default"],
  langs: [],
});

async function loadFenceLanguages(markdown) {
  const langs = new Set(
    [...markdown.matchAll(/^[ \t]*```([\w+#-]+)/gm)].map((m) => m[1].toLowerCase())
  );
  for (const lang of langs) {
    if (lang in bundledLanguages) await highlighter.loadLanguage(lang);
  }
}

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = lang?.trim().split(/\s+/)[0].toLowerCase() ?? "";
      const loaded = highlighter.getLoadedLanguages().includes(language);
      return highlighter.codeToHtml(text, {
        lang: loaded ? language : "text",
        themes: { light: "github-light", dark: "github-dark-default" },
        defaultColor: false,
        transformers: [
          {
            pre(node) {
              if (loaded) node.properties["data-lang"] = language;
            },
          },
        ],
      });
    },
  },
});

/**
 * A post is either a single file (`my-post.md`) or a folder
 * (`my-post/index.md`) holding its media alongside it.
 */
function findPosts(collection) {
  const dir = path.join(contentDir, collection);
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .map((dirent) => {
      if (dirent.isFile() && dirent.name.endsWith(".md")) {
        return {
          collection,
          slug: dirent.name.replace(/\.md$/, ""),
          mdPath: path.join(dir, dirent.name),
          mediaDir: null,
        };
      }
      if (dirent.isDirectory()) {
        const postDir = path.join(dir, dirent.name);
        const mdPath = path.join(postDir, "index.md");
        if (!fs.existsSync(mdPath)) return null;
        return { collection, slug: dirent.name, mdPath, mediaDir: postDir };
      }
      return null;
    })
    .filter(Boolean);
}

/** Copy every non-markdown file in a post folder to public/<collection>/<slug>/. */
function copyMedia({ collection, slug, mediaDir }) {
  if (!mediaDir) return;

  const files = fs
    .readdirSync(mediaDir, { withFileTypes: true })
    .filter((d) => d.isFile() && !d.name.endsWith(".md") && !d.name.startsWith("."));
  if (files.length === 0) return;

  const dest = path.join(publicDir, collection, slug);
  fs.mkdirSync(dest, { recursive: true });
  for (const file of files) {
    fs.copyFileSync(path.join(mediaDir, file.name), path.join(dest, normalizeFileName(file.name)));
  }
}

function mediaUrl(post, file) {
  return `/${post.collection}/${encodeURIComponent(post.slug)}/${encodeURIComponent(file)}`;
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
      const src = mediaUrl(post, normalizeFileName(file));

      const available = post.mediaDir ? fs.readdirSync(post.mediaDir).map(normalizeFileName) : [];
      if (post.mediaDir && !available.includes(normalizeFileName(file))) {
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
    (_, alt, file) => `![${alt}](${mediaUrl(post, decodeURIComponent(file))})`
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
  // Prefixed so footnote ids stay unique when posts from two collections are on screen.
  const idPrefix = `${post.collection}-${post.slug}`;

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
    citeFootnotes(chunk, definitions, order, idPrefix)
  );

  return marked.parse(markdown) + renderFootnotes(definitions, order, idPrefix);
}

async function generateCollection({ name, outFile, output }) {
  fs.mkdirSync(path.join(contentDir, name), { recursive: true });
  fs.rmSync(path.join(publicDir, name), { recursive: true, force: true });

  const posts = findPosts(name).map((post) => ({
    ...post,
    content: fs.readFileSync(post.mdPath, "utf-8"),
  }));
  for (const { content } of posts) await loadFenceLanguages(content);

  const entries = posts
    .map((post) => {
      const match = post.content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) {
        console.warn(`⚠️  ${name}/${post.slug}: no frontmatter, skipped`);
        return null;
      }

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

      return { slug: post.slug, title, date, body };
    })
    .filter(Boolean);

  const outPath = path.join(dataDir, outFile);
  fs.writeFileSync(outPath, JSON.stringify(output(entries), null, 2), "utf-8");
  console.log(`✅ Generated ${entries.length} ${name} entries → ${outPath}`);
}

for (const collection of COLLECTIONS) await generateCollection(collection);
