import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const acpRoot = path.resolve(here, "../..");
const dist = path.resolve(here, "../dist");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function patchPreProductAssets() {
  const appJs = path.join(dist, "pre-product", "app.js");
  if (fs.existsSync(appJs)) {
    const source = fs.readFileSync(appJs, "utf8");
    fs.writeFileSync(
      appJs,
      source.replace('fetch("/api/analyze"', 'fetch("/api/pre-product/analyze"'),
    );
  }

  const indexHtml = path.join(dist, "pre-product", "index.html");
  if (!fs.existsSync(indexHtml)) return;
  let html = fs.readFileSync(indexHtml, "utf8");
  html = html
    .replace('href="/styles.css"', 'href="/pre-product/styles.css"')
    .replace('src="/app.js"', 'src="/pre-product/app.js"');
  fs.writeFileSync(indexHtml, html);
}

function copyPostLaunchPreview() {
  const srcRoot = path.join(acpRoot, "seller-dashboard-preview");
  const dest = path.join(dist, "seller-dashboard");
  copyDir(srcRoot, dest);

  const indexHtml = path.join(dest, "index.html");
  if (!fs.existsSync(indexHtml)) return;
  let html = fs.readFileSync(indexHtml, "utf8");
  html = html.replace(
    '<script type="module" src="./dashboard-preview.js"></script>',
    '<script type="module" src="/seller-dashboard/dashboard-preview.js"></script>',
  );
  fs.writeFileSync(indexHtml, html);
}

copyDir(path.join(acpRoot, "pre-product-analysis/src/dashboard"), path.join(dist, "pre-product"));
patchPreProductAssets();
copyPostLaunchPreview();

console.log("Copied pre-product and seller dashboards into demo-ui/dist");
