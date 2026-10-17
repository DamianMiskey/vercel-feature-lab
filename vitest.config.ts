import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit and route-handler tests run in Node. End-to-end tests against preview
// deployments (Playwright) come later, once the lab is on Vercel.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
