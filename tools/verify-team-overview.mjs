import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const address = process.env.PORTFOLIO_URL ?? 'http://127.0.0.1:5173/';
const profile = await mkdtemp(join(tmpdir(), 'portfolio-team-check-'));
const chrome = spawn(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1920,1080', 'about:blank',
], { stdio: 'ignore' });

try {
  let port;
  for (let i = 0; i < 60; i += 1) {
    try {
      port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
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
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: address });
  await evaluate("new Promise(resolve => { if (document.readyState === 'complete') resolve(true); else window.addEventListener('load', () => resolve(true), { once: true }); })");
  await evaluate('document.fonts.ready.then(() => true)');

  const layout = await evaluate(`(() => {
    const section = document.querySelector('[data-team-overview]');
    const positions = Object.fromEntries(['note', 'kicker', 'label', 'sticker-list', 'summary', 'meta'].map(name => {
      const element = section.querySelector('.team-overview__' + name);
      return [name, { x: element.offsetLeft, y: element.offsetTop, width: element.offsetWidth, height: element.offsetHeight }];
    }));
    const buttons = [...section.querySelectorAll('.team-overview__sticker')];
    return { positions, buttons: buttons.map(button => ({ width: button.getBoundingClientRect().width, textWidth: button.querySelector('span').getBoundingClientRect().width, href: button.href, texture: getComputedStyle(button, '::before').backgroundImage })) };
  })()`);
  const expected = { note: [964, 105, 806, 472], kicker: [855, 105], label: [1517, 477], 'sticker-list': [964, 577], summary: [964, 695], meta: [964, 797] };
  for (const [name, values] of Object.entries(expected)) {
    const actual = layout.positions[name];
    const keys = ['x', 'y', 'width', 'height'];
    if (values.some((value, index) => Math.abs(actual[keys[index]] - value) > 2)) {
      throw new Error(`${name} 위치·크기 불일치: ${JSON.stringify(actual)}`);
    }
  }
  if (layout.buttons.length !== 2 || layout.buttons[1].width <= layout.buttons[0].width + 25 || layout.buttons.some(button => button.width <= button.textWidth || !button.href || !button.texture.includes('team-overview-fabric-button'))) {
    throw new Error(`버튼의 가변 너비·이미지·링크가 올바르지 않습니다: ${JSON.stringify(layout.buttons)}`);
  }

  const sequenceTop = await evaluate("document.querySelector('[data-intro-story-sequence]').getBoundingClientRect().top + scrollY");
  const teamOffset = await evaluate("document.querySelector('[data-team-overview]').offsetLeft");
  const teamScroll = sequenceTop + 1920 * (1.45 + .2) + teamOffset + 300;
  const inspectScene = async scrollTop => {
    await evaluate(`window.scrollTo({ top: ${scrollTop}, behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 1600))`);
    return evaluate("(() => { const section = document.querySelector('[data-team-overview]'); const buttons = section.querySelector('.team-overview__sticker-list'); return { x: Math.round(section.getBoundingClientRect().left), active: section.classList.contains('is-active'), opacity: Number(getComputedStyle(buttons).opacity) }; })()");
  };
  const entered = await inspectScene(teamScroll);
  if (Math.abs(entered.x) > 40 || !entered.active || entered.opacity < .9) throw new Error(`팀 장면 진입 실패: ${JSON.stringify(entered)}`);
  const teamTape = await evaluate("(() => { const section = document.querySelector('[data-team-overview]'); const r = section.querySelector('.team-overview__kicker').getBoundingClientRect(); return { x: r.x - section.getBoundingClientRect().x, y: r.y, width: r.width, height: r.height }; })()");
  const mainOffset = await evaluate("document.querySelector('[data-team-mockup]').offsetLeft");
  const handoffScroll = sequenceTop + 1920 * (1.45 + .2) + mainOffset + 1920 * .55;
  const firstScroll = handoffScroll - 300;
  await inspectScene(firstScroll);
  const firstPreview = await evaluate("(() => { const sticker = document.querySelector('[data-team-mockup] .team-mockup__kicker-sticker'); const r = sticker.getBoundingClientRect(); const left = document.querySelector('[data-team-mockup] .team-mockup__desktop').getBoundingClientRect(); const title = document.querySelector('[data-team-overview] h2 span:last-child').getBoundingClientRect(); const label = document.querySelector('[data-team-mockup] .team-mockup__label').getBoundingClientRect(); return { tapeX: Math.round(r.x), tapeY: Math.round(r.y), tapeOpacity: Number(getComputedStyle(sticker).opacity), leftX: Math.round(left.x), titleX: Math.round(title.x), titleY: Math.round(title.y), titleWidth: Math.round(title.width), labelX: Math.round(label.x), labelY: Math.round(label.y) }; })()");
  if (Math.abs(firstPreview.tapeX - teamTape.x) > 2 || Math.abs(firstPreview.tapeY - teamTape.y) > 2 || firstPreview.tapeOpacity < .9 || Math.abs(firstPreview.leftX - 58) > 2 || Math.abs(firstPreview.labelX - 1517) > 2 || Math.abs(firstPreview.labelY - 477) > 2) throw new Error(`First mockup preview failed: ${JSON.stringify(firstPreview)}`);
  const firstScreenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(tmpdir(), 'portfolio-team-first-mockup.png'), Buffer.from(firstScreenshot.data, 'base64'));
  const mainScroll = handoffScroll + 1920 * .2;
  await inspectScene(teamScroll);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(tmpdir(), 'portfolio-team-overview.png'), Buffer.from(screenshot.data, 'base64'));
  await inspectScene(sequenceTop + 800);
  const returned = await inspectScene(teamScroll);
  if (Math.abs(returned.x) > 40 || !returned.active || returned.opacity < .9) throw new Error(`팀 장면 재진입 실패: ${JSON.stringify(returned)}`);
  const sceneState = async scrollTop => {
    await evaluate(`window.scrollTo({ top: ${scrollTop}, behavior: 'instant' }); new Promise(resolve => setTimeout(resolve, 1600))`);
    return evaluate(`(() => {
      const main = document.querySelector('[data-team-mockup]');
      const sub = document.querySelector('[data-team-subpage]');
      const left = main.querySelector('.team-mockup__desktop').getBoundingClientRect();
      const note = main.querySelector('.team-mockup__note').getBoundingClientRect();
      const title = main.querySelector('h2 span:last-child').getBoundingClientRect();
      const label = main.querySelector('.team-mockup__label').getBoundingClientRect();
      const action = main.querySelector('.team-mockup__sticker-list').getBoundingClientRect();
      const button = main.querySelector('.team-mockup__sticker-list a');
      const buttonRect = button.getBoundingClientRect();
      const buttonClickable = document.elementFromPoint(buttonRect.x + buttonRect.width / 2, buttonRect.y + buttonRect.height / 2)?.closest('a') === button;
      const subButton = sub.querySelector('.team-mockup__sticker-list a');
      const subButtonRect = subButton.getBoundingClientRect();
      const subButtonClickable = document.elementFromPoint(subButtonRect.x + subButtonRect.width / 2, subButtonRect.y + subButtonRect.height / 2)?.closest('a') === subButton;
      const subAction = sub.querySelector('.team-mockup__sticker-list').getBoundingClientRect();
      const subRect = selector => { const r = sub.querySelector(selector).getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; };
      const opacity = element => Number(getComputedStyle(element).opacity);
      return {
        leftX: Math.round(left.x), leftY: Math.round(left.y),
        noteX: Math.round(note.x), noteY: Math.round(note.y),
        titleX: Math.round(title.x), titleY: Math.round(title.y), titleWidth: Math.round(title.width),
        labelX: Math.round(label.x), labelY: Math.round(label.y),
        actionX: Math.round(action.x), actionY: Math.round(action.y),
        buttonClickable, subButtonClickable,
        firstActionText: main.querySelector('.team-mockup__sticker-list a span').textContent,
        subActionText: subButton.querySelector('span').textContent,
        subActionX: Math.round(subAction.x), subActionY: Math.round(subAction.y),
        subTapeRect: subRect('.team-mockup__kicker-sticker'),
        carStickers: document.querySelectorAll('.team-overview__car, .team-mockup__car').length,
        subSummaryRect: subRect('.team-mockup__summary'),
        mainTape: opacity(main.querySelector('.team-mockup__kicker-sticker')),
        subTape: opacity(sub.querySelector('.team-mockup__kicker-sticker')),
        subVisualCount: sub.querySelectorAll('.team-mockup__visual, .team-mockup__note, .team-mockup__label, h2').length,
        mainSummary: opacity(main.querySelector('.team-mockup__summary')),
        subSummary: opacity(sub.querySelector('.team-mockup__summary')),
        mainMeta: opacity(main.querySelector('.team-mockup__meta')),
        subMeta: opacity(sub.querySelector('.team-mockup__meta')),
        mainActions: opacity(main.querySelector('.team-mockup__sticker-list')),
        subActions: opacity(sub.querySelector('.team-mockup__sticker-list')),
        mainButtonX: Math.round(buttonRect.x), mainButtonY: Math.round(buttonRect.y), mainButtonOpacity: opacity(button),
        subButtonX: Math.round(subButtonRect.x), subButtonY: Math.round(subButtonRect.y), subButtonOpacity: opacity(subButton),
        mainButtonTransform: getComputedStyle(button).transform,
        subButtonTransform: getComputedStyle(subButton).transform,
        subpagePreview: main.classList.contains('is-subpage-preview'),
        previews: [...main.querySelectorAll('.team-mockup__page-preview')].map(preview => { const image = preview.querySelector('img'); return { source: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, width: image.naturalWidth, height: image.naturalHeight, opacity: Number(getComputedStyle(preview).opacity), animation: getComputedStyle(image).animationName, playState: getComputedStyle(image).animationPlayState }; }),
      };
    })()`);
  };
  const mainState = await sceneState(mainScroll);
  const subpageStart = handoffScroll + 1920 * .45;
  const midpointState = await sceneState(subpageStart + 960);
  const landingState = await sceneState(subpageStart + 1500);
  const subpageState = await sceneState(subpageStart + 1920 + 300);
  const subpageScreenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(tmpdir(), 'portfolio-team-subpage.png'), Buffer.from(subpageScreenshot.data, 'base64'));
  const reversedMainState = await sceneState(mainScroll);
  if (midpointState.mainSummary + midpointState.subSummary < .1 || midpointState.mainMeta + midpointState.subMeta < .1) {
    throw new Error(`Transition content disappeared: ${JSON.stringify(midpointState)}`);
  }
  if (midpointState.previews.some(preview => preview.playState !== 'paused')) {
    throw new Error(`Preview continued during transition: ${JSON.stringify(midpointState.previews)}`);
  }
  if (landingState.mainActions > .1 || landingState.subActions < .1 || subpageState.subActions < .9 || reversedMainState.mainActions < .9 || [midpointState, landingState, subpageState, reversedMainState].some(state => state.mainButtonTransform !== 'none' || state.subButtonTransform !== 'none')) {
    throw new Error(`Button reveal failed: ${JSON.stringify({ midpointState, landingState, subpageState, reversedMainState })}`);
  }
  if ([midpointState, subpageState, reversedMainState].some(state => ['leftX', 'leftY'].some(key => Math.abs(state[key] - mainState[key]) > 3) || state.subVisualCount !== 0) || ['noteX', 'noteY', 'titleX', 'titleY', 'titleWidth', 'labelX', 'labelY', 'actionX', 'actionY'].some(key => Math.abs(subpageState[key] - midpointState[key]) > 3) || ['titleX', 'titleY', 'titleWidth'].some(key => Math.abs(firstPreview[key] - midpointState[key]) > 3)) {
    throw new Error(`Left mockup moved or changed: ${JSON.stringify({ mainState, midpointState, subpageState, reversedMainState })}`);
  }
  if (mainState.firstActionText !== 'Web site' || subpageState.subActionText !== 'Sub page' || reversedMainState.firstActionText !== 'Web site') {
    throw new Error(`Shared button label failed: ${JSON.stringify({ mainState, subpageState, reversedMainState })}`);
  }
  if (subpageState.subActionX !== 964 || subpageState.subActionY !== 577 || Math.abs(subpageState.subTapeRect.x - 855) > 2 || Math.abs(subpageState.subTapeRect.y - 105) > 2 || Math.abs(subpageState.subSummaryRect.x - 964) > 2 || Math.abs(subpageState.subSummaryRect.y - 699) > 2 || Math.abs(subpageState.labelX - firstPreview.labelX) > 2 || Math.abs(subpageState.labelY - firstPreview.labelY) > 2 || subpageState.carStickers !== 0) {
    throw new Error(`Subpage Figma geometry failed: ${JSON.stringify(subpageState)}`);
  }
  if (!subpageState.subButtonClickable || subpageState.subActions < .9 || subpageState.mainActions > .1) {
    throw new Error(`Shared button cannot be clicked: ${JSON.stringify({ mainState, subpageState, reversedMainState })}`);
  }
  if (subpageState.mainTape > .1 || subpageState.subTape < .9 || reversedMainState.subTape > .1) {
    throw new Error(`Tape handoff failed: ${JSON.stringify({ mainState, subpageState, reversedMainState })}`);
  }
  if (!subpageState.subpagePreview || subpageState.previews.length !== 4 || subpageState.previews.some(preview => !preview.loaded || preview.animation !== 'team-mockup-page-scroll') || subpageState.previews.filter(preview => preview.source.includes('mobility-')).some(preview => preview.opacity < .9 || preview.playState !== 'running') || subpageState.previews.filter(preview => !preview.source.includes('mobility-')).some(preview => preview.playState !== 'paused') || reversedMainState.subpagePreview || reversedMainState.previews.filter(preview => preview.source.includes('mobility-')).some(preview => preview.opacity > .1 || preview.playState !== 'paused') || reversedMainState.previews.filter(preview => !preview.source.includes('mobility-')).some(preview => preview.playState !== 'running')) {
    throw new Error(`Subpage preview handoff failed: ${JSON.stringify({ subpageState, reversedMainState })}`);
  }
  const desktopPreview = subpageState.previews.find(preview => preview.source.includes('mobility-desktop'));
  const mobilePreview = subpageState.previews.find(preview => preview.source.includes('mobility-mobile'));
  if (desktopPreview.width !== 1440 || desktopPreview.height < 4000 || mobilePreview.width !== 390 || mobilePreview.height < 4000) {
    throw new Error(`Subpage preview resolution failed: ${JSON.stringify({ desktopPreview, mobilePreview })}`);
  }
  const responsive = [];
  for (const width of [820, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await send('Page.navigate', { url: address });
    await evaluate("new Promise(resolve => { if (document.readyState === 'complete') resolve(true); else window.addEventListener('load', () => resolve(true), { once: true }); })");
    await evaluate('document.fonts.ready.then(() => true)');
    const state = await evaluate(`(() => {
      const section = document.querySelector('[data-team-subpage]');
      const box = section.getBoundingClientRect();
      const rect = selector => { const r = section.querySelector(selector).getBoundingClientRect(); return { top: Math.round(r.top - box.top), bottom: Math.round(r.bottom - box.top) }; };
      return { width: innerWidth, height: Math.round(box.height), tape: rect('.team-mockup__kicker-sticker'), actions: rect('.team-mockup__sticker-list'), details: rect('.team-subpage__details'), duplicatedImages: section.querySelectorAll('.team-mockup__visual, .team-mockup__note, .team-mockup__label').length };
    })()`);
    if (state.details.bottom > state.height || state.actions.bottom >= state.details.top || state.duplicatedImages !== 0) throw new Error(`Responsive subpage layout failed: ${JSON.stringify(state)}`);
    responsive.push(state);
  }
  console.log(JSON.stringify({ layout: layout.positions, entered, returned, teamTape, firstPreview, mainState, midpointState, subpageState, reversedMainState, responsive }));
  socket.close();
} finally {
  chrome.kill();
  if (profile.startsWith(tmpdir() + '\\')) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
