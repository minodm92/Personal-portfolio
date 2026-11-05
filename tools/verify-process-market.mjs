import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.env.PORTFOLIO_URL ?? 'http://127.0.0.1:5173/';
const profile = await mkdtemp(join(tmpdir(), 'process-market-check-'));
const chrome = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

try {
  let port;
  for (let i = 0; i < 100; i += 1) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  if (!port) throw new Error('Chrome debugging port unavailable');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  for (const [width, height, mobile] of [[1920, 1080, false], [390, 844, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Page.navigate', { url });
    await evaluate("new Promise(resolve => { if (document.readyState === 'complete') resolve(true); else addEventListener('load', () => resolve(true), { once: true }); })");
    await evaluate('document.fonts.ready.then(() => true)');
    if (!mobile) {
      const failedImages = await evaluate(`Promise.all([...document.querySelectorAll('[data-market-image-src]')].map(button => new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve(null);
        image.onerror = () => resolve(button.dataset.marketImageSrc);
        image.src = button.dataset.marketImageSrc;
      }))).then(results => results.filter(Boolean))`);
      if (failedImages.length) throw new Error(`Built button images failed to load: ${JSON.stringify(failedImages)}`);
    }
    if (!mobile) {
      const start = await evaluate(`(() => {
        const sequence = document.querySelector('[data-process-market-sequence]');
        const track = sequence.querySelector('[data-process-market-track]');
        const panel = sequence.querySelector('[data-market-panel]');
        return sequence.getBoundingClientRect().top + scrollY + innerHeight * .3 + panel.offsetLeft;
      })()`);
      await evaluate(`scrollTo({ top: ${start}, behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 2200))`);
    } else {
      await evaluate(`document.querySelector('[data-market-panel]').scrollIntoView({ behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 600))`);
    }
    const layout = await evaluate(`(() => {
      const panel = document.querySelector('[data-market-panel]');
      const base = panel.getBoundingClientRect();
      const rect = selector => { const r = panel.querySelector(selector).getBoundingClientRect(); return { x: Math.round(r.x - base.x), y: Math.round(r.y - base.y), width: Math.round(r.width), height: Math.round(r.height) }; };
      return { panelX: Math.round(base.x), note: rect('.process-market__frame'), strip: rect('.process-market__heading'), title: rect('h2'), detail: rect('.process-market__description'), buttons: [...panel.querySelectorAll('button')].map(button => ({ text: button.textContent, width: Math.round(button.getBoundingClientRect().width) })), images: [...panel.querySelectorAll('img')].filter(img => getComputedStyle(img).display !== 'none').map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })) };
    })()`);
    if (layout.images.some(img => !img.loaded) || layout.buttons.length !== 4 || layout.buttons.some(button => button.width < 76)) throw new Error(JSON.stringify(layout));
    if (!mobile && (Math.abs(layout.note.x - 134) > 3 || Math.abs(layout.note.y - 209) > 3 || Math.abs(layout.strip.x - 960) > 3 || Math.abs(layout.strip.y - 448) > 3)) throw new Error(JSON.stringify(layout));
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(tmpdir(), `process-market-${width}.png`), Buffer.from(shot.data, 'base64'));
    const interaction = await evaluate(`(async () => {
      const panels = [...document.querySelectorAll('[data-market-panel]')];
      const panel = panels[0];
      const buttons = [...panel.querySelectorAll('[data-market-image-src]')];
      const initialStates = panels.map(item => ({ selected: item.querySelector('[data-market-image-src]')?.getAttribute('aria-pressed'), visible: Number(getComputedStyle(item.querySelector('.process-market__photo')).opacity) > .9 }));
      const before = getComputedStyle(panel.querySelector('.process-market__photo')).opacity;
      const tapeBefore = getComputedStyle(panel.querySelector('.process-market__frame'), '::after').opacity;
      buttons[0].click();
      await new Promise(resolve => setTimeout(resolve, 220));
      const revealed = getComputedStyle(panel.querySelector('.process-market__photo')).opacity;
      const tapeRevealed = getComputedStyle(panel.querySelector('.process-market__frame'), '::after').opacity;
      buttons[1].click();
      await new Promise(resolve => setTimeout(resolve, 250));
      const tapeChanged = getComputedStyle(panel.querySelector('.process-market__frame'), '::after').opacity;
      return { count: panels.length, buttonCounts: panels.map(item => item.querySelectorAll('[data-market-image-src]').length), initialStates, before, revealed, tapeBefore, tapeRevealed, tapeChanged, selected: buttons[1].getAttribute('aria-pressed'), image: panel.querySelector('[data-market-image]').getAttribute('src') };
    })()`);
    if (interaction.count !== 6 || interaction.buttonCounts.some(count => count < 2) || interaction.initialStates.some(state => state.selected !== 'true' || !state.visible) || Number(interaction.before) < .9 || Number(interaction.revealed) < .9 || Number(interaction.tapeBefore) !== .55 || interaction.tapeRevealed !== interaction.tapeBefore || interaction.tapeChanged !== interaction.tapeBefore || interaction.selected !== 'true' || !interaction.image.includes('competitor')) throw new Error(JSON.stringify(interaction));
    const revealedShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(tmpdir(), `process-market-revealed-${width}.png`), Buffer.from(revealedShot.data, 'base64'));
    await evaluate(`document.querySelector('[data-market-panel] [data-market-image-src*="steep"]').click(); new Promise(resolve => setTimeout(resolve, 300))`);
    const steepShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(tmpdir(), `process-market-steep-${width}.png`), Buffer.from(steepShot.data, 'base64'));
    const interviewScroll = await evaluate(`(() => {
      const sequence = document.querySelector('[data-process-market-sequence]');
      const panel = document.querySelectorAll('[data-market-panel]')[1];
      return ${mobile} ? panel.getBoundingClientRect().top + scrollY : sequence.getBoundingClientRect().top + scrollY + innerHeight * .3 + panel.offsetLeft;
    })()`);
    await evaluate(`scrollTo({ top: ${interviewScroll}, behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, ${mobile ? 600 : 2200}))`);
    const interviewPanel = await evaluate(`(() => {
      const panel = document.querySelectorAll('[data-market-panel]')[1];
      const image = panel.querySelector('[data-market-image]');
      const photo = panel.querySelector('.process-market__photo');
      const scale = Math.min(photo.clientWidth / image.naturalWidth, photo.clientHeight / image.naturalHeight);
      const imageRect = image.getBoundingClientRect();
      const photoRect = photo.getBoundingClientRect();
      return { src: image.getAttribute('src'), loaded: image.complete, width: image.naturalWidth, height: image.naturalHeight, fit: getComputedStyle(image).objectFit, photoWidth: photo.clientWidth, photoHeight: photo.clientHeight, imageWidth: image.naturalWidth * scale, imageHeight: image.naturalHeight * scale, insetX: imageRect.x - photoRect.x, insetY: imageRect.y - photoRect.y, boxWidth: imageRect.width, boxHeight: imageRect.height, selected: panel.classList.contains('is-original-selected') };
    })()`);
    if (!interviewPanel.src.includes('process-interview-original-figma') || !interviewPanel.loaded || interviewPanel.width !== 482 || interviewPanel.height !== 388 || interviewPanel.fit !== 'contain' || !interviewPanel.selected || interviewPanel.insetX < 18 || interviewPanel.insetY < 25 || interviewPanel.boxWidth >= interviewPanel.photoWidth || interviewPanel.boxHeight >= interviewPanel.photoHeight) throw new Error(JSON.stringify(interviewPanel));
    const interviewShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(tmpdir(), `process-market-interview-${width}.png`), Buffer.from(interviewShot.data, 'base64'));
    const interviewSwitch = await evaluate(`(async () => {
      const panel = document.querySelectorAll('[data-market-panel]')[1];
      const buttons = panel.querySelectorAll('[data-market-image-src]');
      buttons[1].click();
      await new Promise(resolve => setTimeout(resolve, 220));
      const changed = !panel.classList.contains('is-original-selected') && panel.querySelector('[data-market-image]').getAttribute('src').includes('questions');
      buttons[0].click();
      await new Promise(resolve => setTimeout(resolve, 220));
      return { changed, restored: panel.classList.contains('is-original-selected') && panel.querySelector('[data-market-image]').getAttribute('src').includes('original-figma') };
    })()`);
    if (!interviewSwitch.changed || !interviewSwitch.restored) throw new Error(JSON.stringify(interviewSwitch));
    console.log(width, JSON.stringify(layout));
  }
  socket.close();
} finally {
  chrome.kill();
  if (profile.startsWith(tmpdir() + '\\')) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
