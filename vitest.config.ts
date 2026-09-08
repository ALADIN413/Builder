import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import "dotenv/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
    },
    globalSetup: ["./test/global-setup.ts"],
    fileParallelism: false,
  },
});