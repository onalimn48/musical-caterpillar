import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");

if (!existsSync(resolve(distDir, "index.html")) || !existsSync(resolve(distDir, "assets"))) {
  throw new Error("Build output is missing dist/index.html or dist/assets.");
}

const docsDir = resolve(root, "docs");

mkdirSync(docsDir, { recursive: true });

for (const entry of readdirSync(docsDir)) {
  rmSync(resolve(docsDir, entry), { recursive: true, force: true });
}

cpSync(distDir, docsDir, { recursive: true });
