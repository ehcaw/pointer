import { defineConfig } from "vitest/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}",
    ],
    exclude: ["node_modules/", ".next/", "dist/"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "dist/",
        "**/*.d.ts",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/not-found.tsx",
        "src/app/**/page.tsx",
        "src/components/ui/**",
        "**/*.stories.{js,jsx,ts,tsx}",
      ],
    },
    server: { deps: { inline: ["convex-test"] } },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  define: {
    // Mock import.meta.glob for convex-test compatibility
    "import.meta.glob": "(() => ({}))",
  },
});
