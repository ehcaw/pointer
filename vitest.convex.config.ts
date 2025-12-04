import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["convex/__tests__/**/*.{test|spec}.{js|jsx|ts|tsx}"],
    exclude: ["node_modules/", ".next/", "dist/"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
