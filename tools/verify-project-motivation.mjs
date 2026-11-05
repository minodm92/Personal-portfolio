import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.env.PORTFOLIO_URL ?? 'http://127.0.0.1:5173/';
const panelName = ['one', 'two', 'three', 'four'].includes(process.env.STORY_PANEL) ? process.env.STORY_PANEL : 'one';
const expectedTitle = { one: 'Project Motivation', two: 'Design Concept', three: 'Team Collaboration', four: 'Before and After' }[panelName];
const expectedTagline = { one: '프로젝트 배경', two: '디자인 방향성', three: '소통과 협업', four: '정보와 경험의 연결' }[panelName];
const profile = await mkdtemp(join(tmpdir(), 'project-motivation-check-'));
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
  if (!port) throw new Error('Chrome 디버깅 포트를 찾지 못했습니다.');
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
  for (const [width, height, mobile] of [[1920, 1080, false], [820, 900, false], [390, 844, true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Page.navigate', { url });
    await evaluate("new Promise(resolve => { if (document.readyState === 'complete') resolve(true); else addEventListener('load', () => resolve(true), { once: true }); })");
    await evaluate('document.fonts.ready.then(() => true)');
    if (width === 1920) {
      const start = await evaluate(`(() => {
        const sequence = document.querySelector('[data-intro-story-sequence]');
        const story = document.querySelector('[data-horizontal-story]');
        const first = document.querySelector('.story-figma--one');
        const target = document.querySelector('.story-figma--${panelName}');
        return sequence.getBoundingClientRect().top + scrollY + innerWidth * (1.45 + .2 + .55 + .45) + story.offsetLeft + target.offsetLeft - first.offsetLeft;
      })()`);
      await evaluate(`scrollTo({ top: ${start + 60}, behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 1800))`);
    } else {
      await evaluate(`document.querySelector('.story-figma--${panelName}').scrollIntoView({ block: 'start', behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 800))`);
    }
    const layout = await evaluate(`(() => {
      const panel = document.querySelector('.story-figma--${panelName}');
      const box = panel.getBoundingClientRect();
      const rect = selector => { const r = panel.querySelector(selector).getBoundingClientRect(); return { x: Math.round(r.x - box.x), y: Math.round(r.y - box.y), width: Math.round(r.width), height: Math.round(r.height) }; };
      return { panelX: Math.round(box.x), panelY: Math.round(box.y), panelWidth: Math.round(box.width), panelHeight: Math.round(box.height), title: panel.querySelector('h2').textContent, tagline: panel.querySelector('.story-figma__tagline').textContent, paragraphs: panel.querySelectorAll('.story-figma__description p').length, brush: rect('.story-figma__brush'), initial: rect('.story-figma__title-initial'), rest: rect('.story-figma__title-rest'), monitor: panel.querySelector('.story-figma__photo') ? rect('.story-figma__photo') : null, paper: panel.querySelector('.story-figma__paper') ? rect('.story-figma__paper') : null, tape: panel.querySelector('.story-figma__paper-tape') ? rect('.story-figma__paper-tape') : null, strip: rect('.story-figma__strip'), copy: rect('.story-figma__copy'), taglineBox: rect('.story-figma__tagline'), description: rect('.story-figma__description'), images: [...panel.querySelectorAll('img')].map(image => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0 })) };
    })()`);
    if (layout.title !== expectedTitle || layout.tagline !== expectedTagline || layout.paragraphs !== (panelName === 'four' ? 0 : 3) || layout.images.some(image => !image.loaded)) throw new Error(JSON.stringify(layout));
    if (!layout.paper || !layout.tape || Math.abs(layout.tape.y + layout.tape.height / 2 - (layout.paper.y + layout.paper.height * 196 / 1190)) > 6 || Math.abs(layout.tape.x + layout.tape.width / 2 - (layout.paper.x + layout.paper.width / 2)) > 2) throw new Error(JSON.stringify(layout));
    if (width === 1920 && (Math.abs(layout.brush.x - 119) > 3 || Math.abs(layout.brush.y - 110) > 3 || Math.abs(layout.initial.x - 208) > 3 || Math.abs(layout.rest.x - ({ one: 289, two: 316, three: 296, four: 322 })[panelName]) > 3 || !layout.monitor || Math.abs(layout.monitor.x - 1029) > 3 || Math.abs(layout.monitor.y - 248) > 3 || Math.abs(layout.paper.x - 1073) > 3 || Math.abs(layout.paper.y + layout.paper.height / 2 - 540) > 3 || Math.abs(layout.strip.x - 137) > 3 || Math.abs(layout.strip.y - 511) > 3 || Math.abs(layout.strip.width - (panelName === 'one' ? 461 : 463)) > 3 || Math.abs(layout.taglineBox.x - ({ one: 198, two: 200, three: 221, four: 211 })[panelName]) > 3 || Math.abs(layout.description.x - 198) > 3 || Math.abs(layout.description.y - 628) > 3)) throw new Error(JSON.stringify(layout));
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(tmpdir(), `story-${panelName}-${width}.png`), Buffer.from(shot.data, 'base64'));
    console.log(width, JSON.stringify(layout));
  }
  socket.close();
} finally {
  chrome.kill();
  if (profile.startsWith(tmpdir() + '\\')) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
