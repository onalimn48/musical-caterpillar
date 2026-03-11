import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        about: resolve(rootDir, "about/index.html"),
        whyMusicalCaterpillar: resolve(rootDir, "why-musical-caterpillar/index.html"),
        noteSpeller: resolve(rootDir, "note-speller/index.html"),
        notesPerMinute: resolve(rootDir, "notes-per-minute/index.html"),
        chordSnowman: resolve(rootDir, "chord-snowman/index.html"),
      },
    },
  }
});
