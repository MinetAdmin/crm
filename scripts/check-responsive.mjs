/**
 * Fails if a page scrolls sideways at common widths.
 * Usage: pnpm check:responsive [url]
 * Needs: pnpm exec playwright install chromium
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3000/";
const WIDTHS = [320, 390, 768, 1024, 1280];

const browser = await chromium.launch();
let failed = false;

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const result = await page.evaluate((viewport) => {
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewport + 1) {
        offenders.push(`${el.tagName}.${String(el.className).slice(0, 50)}`);
      }
    }
    return { docWidth: document.documentElement.scrollWidth, offenders: offenders.slice(0, 5) };
  }, width);

  const overflows = result.docWidth > width;
  if (overflows) failed = true;
  console.log(
    `${overflows ? "FAIL" : "ok  "} ${width}px, document ${result.docWidth}px` +
      (result.offenders.length ? `\n      ${result.offenders.join("\n      ")}` : ""),
  );
  await page.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
