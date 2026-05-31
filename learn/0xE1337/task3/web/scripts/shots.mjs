import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = new URL("../screenshots", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || "http://localhost:3100";

const log = (m) => console.log(`[shots] ${m}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

async function step(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`);
  } catch (e) {
    log(`✗ ${name}: ${e.message}`);
  }
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1800); // fonts + live counter

await step("01-hero", async () => {
  await page.screenshot({ path: `${OUT}/01-hero.png` });
});

await step("02-compare", async () => {
  await page.locator("#why").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.locator("#why").screenshot({ path: `${OUT}/02-compare.png` });
});

await step("03-issue", async () => {
  await page.locator("#issue").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /签发/ }).first().click();
  await page.getByText("已签发上链").first().waitFor();
  await page.waitForTimeout(400);
  await page.locator("#issue").screenshot({ path: `${OUT}/03-issue.png` });
});

await step("04-gate", async () => {
  await page.locator("#gate").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /加载我的凭证/ }).click();
  await page.locator("#gate").getByText("够格").first().waitFor();
  await page.waitForTimeout(400);
  await page.locator('#gate button:has-text("tier 3")').first().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /生成通行证明/ }).click();
  await page.getByText("通行已记录上链").first().waitFor({ timeout: 15000 });
  await page.locator("#gate").getByText("不知道").first().waitFor();
  await page.waitForTimeout(600);
  await page.locator("#gate").screenshot({ path: `${OUT}/04-gate.png` });
});

await step("05-full", async () => {
  await page.screenshot({ path: `${OUT}/05-full.png`, fullPage: true });
});

await step("06-hero-mobile", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/06-hero-mobile.png` });
});

await browser.close();
log("done");
