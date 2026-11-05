import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const address = process.env.PORTFOLIO_URL ?? "http://127.0.0.1:5173/";
const profile = await mkdtemp(join(tmpdir(), "portfolio-intro-check-"));
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--window-size=1920,1080", "about:blank",
], { stdio: "ignore" });

try {
  let port;
  for (let i = 0; i < 60; i += 1) {
    try {
      port = Number((await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  if (!port) throw new Error("브라우저 디버깅 포트를 열 수 없습니다.");
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const tab = tabs.find((item) => item.type === "page");
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: address });
  await evaluate("new Promise(resolve => { if (document.readyState === 'complete') resolve(true); else window.addEventListener('load', () => resolve(true), { once: true }); })");
  await evaluate("document.fonts.ready.then(() => true)");
  const headerLayout = await evaluate("(() => { const header = document.querySelector('.site-header').getBoundingClientRect(); const menu = document.querySelector('.site-header .site-nav').getBoundingClientRect(); const link = document.querySelector('.site-header .site-nav a'); return { x: Math.round(menu.left - header.left), y: Math.round(menu.top - header.top), font: getComputedStyle(link).fontFamily }; })()");
  if (headerLayout.x !== 534 || headerLayout.y !== 7 || !headerLayout.font.includes('DM Sans')) {
    throw new Error("헤더 메뉴의 Figma 위치 또는 글꼴이 일치하지 않습니다.");
  }
  const introTwoTitle = await evaluate("(() => { const title = document.querySelector('.intro-2-figma__title'); return { text: [...title.children].map(line => line.textContent.trim()), fontSize: getComputedStyle(title).fontSize }; })()");
  if (introTwoTitle.fontSize !== '60px' || JSON.stringify(introTwoTitle.text) !== JSON.stringify(['MY DESIGN BEGINS WITH WHO I AM.', 'THREE VALUES TELL THE REST OF MY STORY.'])) {
    throw new Error("Intro 2 제목 문구 또는 60px 글자 크기가 일치하지 않습니다.");
  }
  const cardCopyAlignment = await evaluate("[...document.querySelectorAll('.intro-2-figma__card')].map(card => { const image = card.querySelector('i'); const copy = card.querySelector('.intro-2-figma__copy'); const frame = image.getBoundingClientRect(); const title = copy.querySelector('strong').getBoundingClientRect(); const body = copy.querySelector('.intro-2-figma__line:nth-of-type(2)').getBoundingClientRect(); const matrix = new DOMMatrix(getComputedStyle(image).transform); const angle = Math.atan2(matrix.b, matrix.a); const center = rect => ({ x: rect.left + rect.width / 2 - frame.left - frame.width / 2, y: rect.top + rect.height / 2 - frame.top - frame.height / 2 }); const project = rect => { const point = center(rect); return { x: Math.round(point.x * Math.cos(angle) + point.y * Math.sin(angle)), y: Math.round(-point.x * Math.sin(angle) + point.y * Math.cos(angle)) }; }; const titlePoint = project(title), bodyPoint = project(body); return { titleX: titlePoint.x, bodyX: bodyPoint.x, gapY: bodyPoint.y - titlePoint.y }; })");
  if (cardCopyAlignment.some(({ titleX, bodyX, gapY }) => Math.abs(titleX) > 3 || Math.abs(bodyX) > 3 || Math.abs(gapY - 100) > 5)) {
    throw new Error(`카드 중심 정렬 또는 제목·본문 간격이 맞지 않습니다: ${JSON.stringify(cardCopyAlignment)}`);
  }
  const start = await evaluate("document.querySelector('#intro').getBoundingClientRect().top + scrollY");
  const inspect = async (offset, name) => {
    await evaluate(`window.scrollTo({ top: ${start} + ${offset}, behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 1300))`);
    const state = await evaluate(`(() => {
      const selectors = ['.intro-profile__note', '.intro-profile__portrait', '.intro-profile__sticker', '.intro-profile__cat--front', '.intro-profile__whoami', '.intro-profile__cup'];
      return Object.fromEntries(selectors.map(selector => {
        const element = document.querySelector(selector);
        const rect = element.getBoundingClientRect();
        return [selector, { opacity: getComputedStyle(element).opacity, x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }];
      }));
    })()`);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(tmpdir(), `portfolio-intro-${name}.png`), Buffer.from(shot.data, "base64"));
    console.log(name, JSON.stringify(state));
    return state;
  };
  const before = await inspect(0, "before");
  const after = await inspect(1700, "after");
  const visibleHighlights = await evaluate("[...document.querySelectorAll('.intro-profile__sticker-copy [data-intro-highlight]')].every(element => getComputedStyle(element).getPropertyValue('--highlight-progress').trim() !== '0')");
  if (!visibleHighlights) {
    throw new Error("메모가 보일 때 형광펜 효과가 유지되지 않습니다.");
  }
  const reversed = await inspect(0, "reversed");
  const introTwoTop = await evaluate("document.querySelector('[data-intro-two]').getBoundingClientRect().top + scrollY");
  const inspectIntroTwoHighlights = async (offset) => {
    await evaluate(`window.scrollTo({ top: ${introTwoTop} + 313 + ${offset}, behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 1300))`);
    return evaluate("[...document.querySelectorAll('[data-intro-two] [data-highlight-step]')].map(mark => Number(getComputedStyle(mark).getPropertyValue('--highlight-progress').trim() || 0))");
  };
  const introTwoStart = await inspectIntroTwoHighlights(0);
  const introTwoMiddle = await inspectIntroTwoHighlights(1200);
  const introTwoEnd = await inspectIntroTwoHighlights(2500);
  const introTwoEndShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(tmpdir(), "portfolio-intro-two-highlighted.png"), Buffer.from(introTwoEndShot.data, "base64"));
  const introTwoReverse = await inspectIntroTwoHighlights(0);
  if (introTwoStart.some(value => value > 0.05) || !introTwoMiddle.some(value => value > 0.95) || !introTwoMiddle.some(value => value < 0.05) || introTwoEnd.some(value => value < 0.95) || introTwoReverse.some(value => value > 0.05)) {
    throw new Error(`Intro 2 형광펜의 순차 진행·역방향 스크롤이 맞지 않습니다: ${JSON.stringify({ introTwoStart, introTwoMiddle, introTwoEnd, introTwoReverse })}`);
  }
  const introTwoShot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(tmpdir(), "portfolio-intro-two.png"), Buffer.from(introTwoShot.data, "base64"));
  const profileReturn = await inspect(1700, "profile-return");
  if (Number(profileReturn[".intro-profile__sticker"].opacity) < 0.9) {
    throw new Error("Intro 2에서 역스크롤할 때 앞 장면으로 복귀하지 않습니다.");
  }
  const highlightedText = await evaluate("[...document.querySelectorAll('.intro-profile__sticker-copy [data-intro-highlight]')].map(element => element.textContent.trim())");
  const expectedHighlights = ["사용자의 행동", "흐름을 예측", "작은 불편함", "직관적인 UI와 섬세한 인터랙션", "웹 경험"];
  if (JSON.stringify(highlightedText) !== JSON.stringify(expectedHighlights)) {
    throw new Error("형광펜 적용 문구가 지정된 범위와 다릅니다.");
  }
  const background = await evaluate("({ shared: getComputedStyle(document.body).backgroundImage, local: Boolean(document.querySelector('.intro-profile__background')) })");
  if (background.shared === "none" || background.local) {
    throw new Error("Intro가 페이지 공통 배경을 사용하지 않습니다.");
  }
  if (Number(before[".intro-profile__sticker"].opacity) > 0.1 || Number(after[".intro-profile__sticker"].opacity) < 0.9) {
    throw new Error("프로필에서 메모 장면으로 전환되지 않았습니다.");
  }
  if (Number(reversed[".intro-profile__sticker"].opacity) > 0.1) {
    throw new Error("역스크롤 시 첫 장면으로 되돌아가지 않습니다.");
  }
  if (before[".intro-profile__note"].x !== 160 || before[".intro-profile__portrait"].x !== 1234 || after[".intro-profile__sticker"].x !== 157) {
    throw new Error("Figma 장면의 주요 오브젝트 위치가 어긋났습니다.");
  }
  socket.close();
} finally {
  chrome.kill();
  if (profile.startsWith(tmpdir() + "\\")) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
