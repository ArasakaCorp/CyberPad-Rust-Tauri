import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    root: "src",
    base: "./",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "src/index.html"),
                settings: resolve(__dirname, "src/settings.html"),
            },
        },
    },
});