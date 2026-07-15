import { defineConfig } from "vitest/config"

// Mirrors tsconfig.json's jsx/jsxImportSource so Preact components under test
// transform the same way they do in the real webpack build.
export default defineConfig({
    esbuild: {
        jsx: "automatic",
        jsxImportSource: "preact",
    },
    test: {
        globals: false,
        environment: "node",
        include: ["src/**/*.test.{ts,tsx}"],
    },
})
