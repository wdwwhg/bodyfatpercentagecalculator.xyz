import { access, copyFile } from "node:fs/promises";

const sitemapIndex = new URL("../dist/sitemap-index.xml", import.meta.url);
const sitemapUrls = new URL("../dist/sitemap-0.xml", import.meta.url);
const sitemapAlias = new URL("../dist/sitemap.xml", import.meta.url);

let source = sitemapIndex;

try {
  await access(source);
} catch {
  source = sitemapUrls;
  await access(source);
}

await copyFile(source, sitemapAlias);

console.log("Created dist/sitemap.xml from the generated Astro sitemap.");
