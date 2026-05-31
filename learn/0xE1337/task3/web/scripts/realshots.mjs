// REAL-mode end-to-end through the actual UI (clicks the buttons → server Leo
// CLI → on-chain). Doubles as fresh real-mode screenshots for the submission.
// Each on-chain step takes ~1 min, so waits are generous.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = new URL("../screenshots-real", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || "http://localhost:3100";
const TX = 200_000; // up to ~3 min per on-chain action
const log = (m) => console.log(`[realshots] ${m}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
page.setDefaultTimeout(20_000);

async function step(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`);
  } catch (e) {
    log(`✗ ${name}: ${e.message}`);
    throw e;
  }
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);

await step("01-hero (LIVE tag)", async () => {
  await page.getByText(/LIVE ·/).first().waitFor();
  await page.screenshot({ path: `${OUT}/01-hero.png` });
});

await step("02-issue (real on-chain ~1min)", async () => {
  await page.locator("#issue").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /签发/ }).first().click();
  await page.getByText("已签发上链").first().waitFor({ timeout: TX });
  await page.waitForTimeout(500);
  await page.locator("#issue").screenshot({ path: `${OUT}/02-issue.png` });
});

await step("03-gate (real prove ~1min → counter +1)", async () => {
  await page.locator("#gate").scrollIntoViewIfNeeded();
  log("  clicking 加载我的凭证");
  await page.getByRole("button", { name: /加载我的凭证/ }).click();
  // Select a CREDENTIAL (its meta line uniquely says "仅你可见"), not a gate card.
  const cred = page.locator('#gate button:has-text("仅你可见")').first();
  await cred.waitFor();
  await cred.click();
  log("  credential selected; clicking 生成通行证明");
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /生成通行证明/ }).click();
  // Strongest "it's real" signal: the on-chain explorer link appears.
  log("  proving on-chain (up to ~3min)…");
  await page
    .locator('#gate a[href*="/transaction/at1"]')
    .first()
    .waitFor({ timeout: TX });
  log("  on-chain tx link present");
  await page.waitForTimeout(800);
  await page.locator("#gate").screenshot({ path: `${OUT}/03-gate.png` });
});

await step("04-full", async () => {
  await page.screenshot({ path: `${OUT}/04-full.png`, fullPage: true });
});

await browser.close();
log("done");
