import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

// Mirrors tsconfig.json's "@/*" -> "./src/*" path alias so tests can import
// components/lib modules the same way app code does.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    // Default excludes only cover node_modules/.git — without also excluding
    // .worktrees/worktrees, running tests from the main checkout while a
    // superpowers worktree exists double-discovers every test file nested
    // inside it.
    exclude: [...configDefaults.exclude, "**/.worktrees/**", "**/worktrees/**"],
  },
});
