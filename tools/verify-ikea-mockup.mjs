import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/mbc/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core");

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});

const livePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await livePage.goto("https://ikea-korea.vercel.app/", { waitUntil: "domcontentloaded", timeout: 120_000 });
await livePage.waitForSelector(".page-loader.is-done", { timeout: 30_000 });
await livePage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await livePage.waitForTimeout(1_000);
await livePage.screenshot({ path: "tools/verify-ikea-live-start.png" });
await livePage.evaluate(() => window.scrollTo({ top: 8400, behavior: "instant" }));
await livePage.waitForTimeout(800);
await livePage.screenshot({ path: "tools/verify-ikea-live-middle.png" });
await livePage.close();

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const failedRequests = [];
page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));

await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForSelector("[data-personal-mockup-video]");

await page.evaluate(() => {
  const panel = document.querySelector('[aria-labelledby="personal-wire-title-1"]');
  const sequence = panel.closest("[data-personal-story-sequence]");
  const track = panel.parentElement;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  sequence.style.cssText = "position:fixed;inset:0;margin:0;z-index:99999;background:#fff;";
  track.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;transform:none;";
  [...track.children].forEach((child) => {
    child.style.display = child === panel ? "block" : "none";
  });
  panel.style.cssText = "position:absolute;inset:0;display:block;width:100vw;height:100vh;transform:none;";
});

await page.mouse.move(500, 500);
const leftCursor = await page.evaluate(() => ({
  panelCursor: getComputedStyle(document.querySelector(".personal-wire--ikea")).cursor,
  customCursorDisplay: getComputedStyle(document.querySelector("[data-personal-enter-cursor]")).display,
}));
await page.mouse.move(1100, 500);
const rightCursor = await page.evaluate(() => ({
  panelCursor: getComputedStyle(document.querySelector(".personal-wire--ikea")).cursor,
  customCursorDisplay: getComputedStyle(document.querySelector("[data-personal-enter-cursor]")).display,
  customCursorText: document.querySelector("[data-personal-enter-cursor]").textContent,
}));
const popupPromise = page.waitForEvent("popup");
await page.mouse.click(1100, 500);
const popup = await popupPromise;
await popup.waitForLoadState("domcontentloaded");
const popupUrl = popup.url();
await popup.close();

const video = page.locator("[data-personal-mockup-video]");
await video.evaluate((element) => new Promise((resolve, reject) => {
  if (element.readyState >= 2) resolve();
  else {
    element.addEventListener("loadeddata", resolve, { once: true });
    element.addEventListener("error", () => reject(element.error), { once: true });
  }
}));

async function capture(time, name) {
  await video.evaluate(async (element, seekTime) => {
    element.currentTime = seekTime;
    await new Promise((resolve) => element.addEventListener("seeked", resolve, { once: true }));
    await element.play();
  }, time);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `tools/${name}.png` });
}

await capture(0, "verify-ikea-start");
await capture(20, "verify-ikea-middle");
await capture(45, "verify-ikea-end");

const result = await page.evaluate(() => {
  const videoElement = document.querySelector("[data-personal-mockup-video]");
  const screen = videoElement.closest(".personal-wire__screen");
  const frame = document.querySelector(".personal-wire__frame");
  const rect = (element) => {
    const bounds = element.getBoundingClientRect();
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  };
  return {
    duration: videoElement.duration,
    videoWidth: videoElement.videoWidth,
    videoHeight: videoElement.videoHeight,
    readyState: videoElement.readyState,
    paused: videoElement.paused,
    playbackRate: videoElement.playbackRate,
    screenRect: rect(screen),
    videoRect: rect(videoElement),
    frameRect: rect(frame),
    objectFit: getComputedStyle(videoElement).objectFit,
  };
});

console.log(JSON.stringify({ result, cursorTest: { leftCursor, rightCursor, popupUrl }, failedRequests }, null, 2));
await browser.close();
