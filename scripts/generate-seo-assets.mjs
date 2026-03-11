import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_OG_IMAGE,
  FAVICON_DATA_URL,
  INDEXABLE_PATHS,
  SITE_NAME,
  SITE_URL,
  STATIC_CONTENT_PATHS,
  toCanonicalUrl,
} from "../src/app/seo/siteMetadata.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const publicDir = resolve(rootDir, "public");

function walkHtmlFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = resolve(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return walkHtmlFiles(fullPath);
    }

    return fullPath.endsWith(".html") ? [fullPath] : [];
  });
}

function getPublicHtmlPath(filePath) {
  const relPath = relative(publicDir, filePath).replaceAll("\\", "/");

  if (relPath.endsWith("/index.html")) {
    return `/${relPath.slice(0, -"/index.html".length)}`;
  }

  return `/${relPath.slice(0, -".html".length)}`;
}

function upsertLinkTag(head, rel, href) {
  const regex = new RegExp(`<link\\s+rel="${rel}"\\s+href="[^"]*"\\s*/?>`);

  if (regex.test(head)) {
    return head.replace(regex, `  <link rel="${rel}" href="${href}">`);
  }

  return `${head}  <link rel="${rel}" href="${href}">\n`;
}

function upsertMetaTag(head, attribute, key, content) {
  const regex = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`);

  if (regex.test(head)) {
    return head.replace(regex, `  <meta ${attribute}="${key}" content="${content}">`);
  }

  return `${head}  <meta ${attribute}="${key}" content="${content}">\n`;
}

function upsertJsonLd(head, payload) {
  const tag = `  <script type="application/ld+json">\n    ${JSON.stringify(payload)}\n  </script>`;
  const regex = /  <script type="application\/ld\+json">[\s\S]*?<\/script>/;

  if (regex.test(head)) {
    return head.replace(regex, tag);
  }

  return `${head}${tag}\n`;
}

function normalizeStaticHtml(filePath) {
  const canonicalPath = getPublicHtmlPath(filePath);
  const canonicalUrl = toCanonicalUrl(canonicalPath);
  const ogType = canonicalPath === "/notes-per-minute-fluency" ? "article" : "website";

  let html = readFileSync(filePath, "utf8");
  html = html.replace(/href="\/([a-z0-9-]+)\.html"/g, 'href="/$1"');
  html = html.replace(
    /href="https:\/\/musicalcaterpillar\.com\/([a-z0-9-]+)\.html"/g,
    'href="https://musicalcaterpillar.com/$1"',
  );

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const descriptionMatch = html.match(/<meta name="description" content="([^"]*)">/);

  if (!titleMatch || !descriptionMatch) {
    throw new Error(`Missing title or description in ${relative(rootDir, filePath)}.`);
  }

  const title = titleMatch[1];
  const description = descriptionMatch[1];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ogType === "article" ? "Article" : "WebPage",
    name: title,
    description,
    url: canonicalUrl,
  };

  const headMatch = html.match(/<head>\n([\s\S]*?)<\/head>/);

  if (!headMatch) {
    throw new Error(`Missing <head> in ${relative(rootDir, filePath)}.`);
  }

  let head = headMatch[1];
  head = upsertMetaTag(head, "name", "robots", "index,follow");
  head = upsertLinkTag(head, "canonical", canonicalUrl);
  head = upsertLinkTag(head, "icon", FAVICON_DATA_URL);
  head = upsertMetaTag(head, "property", "og:site_name", SITE_NAME);
  head = upsertMetaTag(head, "property", "og:type", ogType);
  head = upsertMetaTag(head, "property", "og:title", title);
  head = upsertMetaTag(head, "property", "og:description", description);
  head = upsertMetaTag(head, "property", "og:url", canonicalUrl);
  head = upsertMetaTag(head, "property", "og:image", DEFAULT_OG_IMAGE);
  head = upsertMetaTag(head, "name", "twitter:card", "summary_large_image");
  head = upsertMetaTag(head, "name", "twitter:title", title);
  head = upsertMetaTag(head, "name", "twitter:description", description);
  head = upsertMetaTag(head, "name", "twitter:image", DEFAULT_OG_IMAGE);
  head = upsertJsonLd(head, jsonLd);

  html = html.replace(/<head>\n[\s\S]*?<\/head>/, `<head>\n${head}</head>`);
  writeFileSync(filePath, html);
}

function writeRedirects() {
  const lines = [
    "http://www.musicalcaterpillar.com/* https://musicalcaterpillar.com/:splat 301!",
    "https://www.musicalcaterpillar.com/* https://musicalcaterpillar.com/:splat 301!",
    "http://musicalcaterpillar.com/* https://musicalcaterpillar.com/:splat 301!",
    ...STATIC_CONTENT_PATHS.flatMap((path) => [
      `${path}.html ${path} 301!`,
      `${path}/index.html ${path} 301!`,
    ]),
    "/* /index.html 200",
  ];

  writeFileSync(resolve(publicDir, "_redirects"), `${lines.join("\n")}\n`);
}

function writeSitemap() {
  const urls = INDEXABLE_PATHS.map((path) => `  <url><loc>${toCanonicalUrl(path)}</loc></url>`);
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, "</urlset>"].join("\n");
  writeFileSync(resolve(publicDir, "sitemap.xml"), `${xml}\n`);
}

function writeRobots() {
  const robots = ["User-agent: *", "Allow: /", "", `Sitemap: ${SITE_URL}/sitemap.xml`].join("\n");
  writeFileSync(resolve(publicDir, "robots.txt"), `${robots}\n`);
}

for (const htmlFile of walkHtmlFiles(publicDir)) {
  normalizeStaticHtml(htmlFile);
}

writeRedirects();
writeSitemap();
writeRobots();
