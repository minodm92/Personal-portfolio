import { createRequire } from "node:module";
import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/mbc/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core");

const projectRoot = path.resolve(import.meta.dirname, "..");
const captureDir = path.join(projectRoot, ".capture-ikea");
const outputDir = path.join(projectRoot, "assets", "components", "personal-story", "videos");
const outputPath = path.join(outputDir, "ikea-korea-desktop.webm");
const rawPath = path.join(captureDir, "ikea-korea-raw.webm");
const ffmpegPath = path.join(process.env.LOCALAPPDATA, "ms-playwright", "ffmpeg-1013", "ffmpeg-win64.exe");
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const targetUrl = "https://ikea-korea.vercel.app/";
const viewport = { width: 1920, height: 1080 };
const scrollSpeed = 420;

await mkdir(captureDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  recordVideo: { dir: captureDir, size: viewport },
});

async function waitForReady(page) {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector(".page-loader.is-done", { timeout: 30_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => {
      if (image.complete) return undefined;
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }));
  });
}

// Warm the shared browser cache so the recorded pass does not reveal lazy asset loading.
const warmupPage = await context.newPage();
await waitForReady(warmupPage);
await warmupPage.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
await warmupPage.waitForTimeout(3_000);
await warmupPage.close();

const pageStart = Date.now();
const page = await context.newPage();
await waitForReady(page);
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = "auto";
  document.body.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, behavior: "instant" });
});
await page.waitForTimeout(2_500);
const scrollStart = Date.now();

const captureData = await page.evaluate(async (pixelsPerSecond) => {
  document.documentElement.style.scrollBehavior = "auto";
  document.body.style.scrollBehavior = "auto";
  const endY = document.documentElement.scrollHeight - innerHeight;
  const duration = (endY / pixelsPerSecond) * 1000;
  const start = performance.now();

  await new Promise((resolve) => {
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo({ top: endY * progress, behavior: "instant" });
      if (progress < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });

  return { endY, duration };
}, scrollSpeed);

await page.waitForTimeout(3_000);
const captureEnd = Date.now();
const recordedVideo = page.video();
await page.close();
await recordedVideo.saveAs(rawPath);
await context.close();
await browser.close();

const trimStart = Math.max(0, ((scrollStart - pageStart) / 1000) - 1.5);
const trimDuration = Math.max(1, ((captureEnd - pageStart) / 1000) - trimStart);
await new Promise((resolve, reject) => {
  const ffmpeg = spawn(ffmpegPath, [
    "-y",
    "-ss", trimStart.toFixed(3),
    "-i", rawPath,
    "-t", trimDuration.toFixed(3),
    "-an",
    "-c:v", "libvpx-vp9",
    "-b:v", "0",
    "-crf", "31",
    outputPath,
  ], { stdio: "inherit" });
  ffmpeg.once("error", reject);
  ffmpeg.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)));
});

await rm(captureDir, { recursive: true, force: true });
console.log(JSON.stringify({
  outputPath,
  resolution: viewport,
  scrollSpeed,
  scrollDistance: captureData.endY,
  scrollDuration: captureData.duration / 1000,
  videoDuration: trimDuration,
}, null, 2));
