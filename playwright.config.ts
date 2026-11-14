import { defineConfig } from "@playwright/test";
if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error("Configure a dedicated TEST_DATABASE_URL ending in _test.");
export default defineConfig({
  testDir: "./tests",
  testMatch: "browser.spec.ts",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:3008",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL!,
      COMMONS_OWNER_EMAIL: "e2e@commons.local",
      APP_URL: "http://localhost:3008",
    },
    command: `node ./node_modules/next/dist/bin/next ${process.env.PLAYWRIGHT_PRODUCTION === "true" ? "start" : "dev"} --hostname 127.0.0.1 --port 3008`,
    url: "http://127.0.0.1:3008",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
