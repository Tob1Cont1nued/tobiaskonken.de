import { defineConfig, devices } from "@playwright/test";

// REPORT_DIR: wohin der HTML-Report und results.json geschrieben werden (report/ok oder report/bug)
// BUG=1: Tests laufen gegen die Seite mit eingebautem Fehler (?bug=lang) und MÜSSEN rot werden.
const reportDir = process.env.REPORT_DIR ?? "report/ok";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: reportDir, open: "never" }],
    ["json", { outputFile: `${reportDir}/results.json` }],
  ],
  outputDir: "test-results",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:4173",
    locale: "de-DE",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "npm run serve", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
});
