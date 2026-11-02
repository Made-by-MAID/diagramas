import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "bin/**/*.spec.ts", "test/**/*.spec.ts"],
    testTimeout: 30000,
    reporters: ["default", "./scripts/skipped-tests-reporter.ts"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts"],
      reporter: ["text-summary", "text"],
      thresholds: {
        "src/**/calculations/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/shared/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
