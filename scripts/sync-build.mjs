import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const distIndex = resolve(distDir, "index.html");
const distAssets = resolve(distDir, "assets");

if (!existsSync(distIndex) || !existsSync(distAssets)) {
  throw new Error("Build output is missing dist/index.html or dist/assets.");
}

const targets = [
  {
    index: resolve(root, "index.html"),
    assets: resolve(root, "assets")
  },
  {
    index: resolve(root, "docs", "index.html"),
    assets: resolve(root, "docs", "assets")
  }
];

for (const target of targets) {
  mkdirSync(target.assets, { recursive: true });
  cpSync(distIndex, target.index);
  cpSync(distAssets, target.assets, { recursive: true });
}
