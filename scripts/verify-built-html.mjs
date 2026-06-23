import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
const notFoundHtml = await readFile(
  new URL("../dist/404.html", import.meta.url),
  "utf8",
);

const requiredSnippets = [
  "<title>Body Fat Percentage Calculator – Navy &amp; BMI Estimate</title>",
  '<link rel="canonical" href="https://bodyfatpercentagecalculator.xyz/">',
  "<h1",
  "Body Fat Percentage Calculator",
  "How to Calculate Body Fat Percentage",
  "US Navy Method",
  "Height and Weight Estimate",
  "Body Fat Percentage Chart by Age and Sex",
  "What Is an Ideal Body Fat Percentage?",
  "How Accurate Is This Calculator?",
  "Body Fat Percentage for Men and Women",
  "Frequently Asked Questions",
  '"@type":"SoftwareApplication"',
  '"@type":"WebSite"',
  "https://www.googletagmanager.com/gtag/js?id=G-4TGXQJXZYS",
  "gtag('config', 'G-4TGXQJXZYS')",
];

for (const snippet of requiredSnippets) {
  assert.ok(html.includes(snippet), `Built HTML is missing: ${snippet}`);
}

assert.ok(
  !html.includes('"@type":"FAQPage"'),
  "FAQPage structured data must not be present.",
);

console.log("Built HTML contains the required static SEO content and metadata.");

for (const snippet of [
  "<title>Page Not Found | Body Fat Percentage Calculator</title>",
  'name="robots" content="noindex, follow"',
  'href="/"',
  "404",
  "Page not found",
]) {
  assert.ok(notFoundHtml.includes(snippet), `Built 404 page is missing: ${snippet}`);
}

console.log("Built output contains a dedicated noindex 404.html page.");
