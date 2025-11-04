import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["extensions/**/*.(test|spec).ts", "packages/**/*.(test|spec).ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["extensions/**/*.ts"],
      exclude: ["**/node_modules/**"]
    }
  }
});
