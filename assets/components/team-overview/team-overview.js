const MOCKUP_EMBED_URL = new URL("/team-mockup/motorstudio-embed.html", window.location.origin).href;
const mockupFrames = new Set();
const frameState = new WeakMap();
let mockupProgress = 0;

function clampProgress(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function elementTop(element, frameWindow) {
  return element.getBoundingClientRect().top + frameWindow.scrollY;
}

function measureFrame(frame) {
  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument;
  if (!frameWindow || !frameDocument?.body) return null;

  const root = frameDocument.documentElement;
  const viewportHeight = Math.max(1, frameWindow.innerHeight);
  const scrollHeight = Math.max(root.scrollHeight, frameDocument.body.scrollHeight);
  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  if (maxScroll <= viewportHeight * .5) return null;

  const videos = [...frameDocument.querySelectorAll("video")]
    .map((video) => ({ video, rect: video.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 1 && rect.height > 1)
    .sort((a, b) => a.rect.top - b.rect.top || (b.rect.width * b.rect.height) - (a.rect.width * a.rect.height));
  const heroVideo = videos[0];
  const heroBottom = heroVideo ? heroVideo.rect.bottom + frameWindow.scrollY : viewportHeight;

  const sections = [...frameDocument.querySelectorAll("main section, main > div, body > section")]
    .map((element) => ({ element, top: elementTop(element, frameWindow) }))
    .filter(({ element, top }) => element.getBoundingClientRect().height > viewportHeight * .35 && top >= heroBottom - 8)
    .sort((a, b) => a.top - b.top);
  const start = Math.min(maxScroll, Math.max(0, sections[0]?.top ?? heroBottom));
  const end = Math.min(maxScroll, start + viewportHeight * 2);

  return { start, end: Math.max(start, end) };
}

function applyFrameProgress(frame, progress = mockupProgress) {
  const state = frameState.get(frame);
  if (!state?.ready) return;

  const metrics = measureFrame(frame) ?? state.metrics;
  if (!metrics) return;
  state.metrics = metrics;

  const target = metrics.start + (metrics.end - metrics.start) * clampProgress(progress);
  frame.contentWindow?.scrollTo({ top: target, left: 0, behavior: "auto" });
}

function prepareFrame(frame) {
  const state = { ready: false, metrics: null, timeout: 0 };
  frameState.set(frame, state);
  mockupFrames.add(frame);

  frame.addEventListener("load", () => {
    let attempts = 0;
    const waitForContent = () => {
      attempts += 1;
      const metrics = measureFrame(frame);
      const hasVideo = Boolean(frame.contentDocument?.querySelector("video"));

      if (metrics && (hasVideo || attempts >= 24)) {
        state.ready = true;
        state.metrics = metrics;
        applyFrameProgress(frame);
        frame.closest(".team-mockup__desktop-screen, .team-mockup__phone-screen")?.classList.add("is-ready");
        return;
      }

      if (attempts < 60) state.timeout = window.setTimeout(waitForContent, 250);
    };

    state.timeout = window.setTimeout(waitForContent, 2200);
  }, { once: true });

  frame.src = MOCKUP_EMBED_URL;
}

function initTeamMockupFrames(section) {
  const frames = section ? [...section.querySelectorAll("[data-team-mockup-frame]")] : [];
  if (!frames.length) return;

  const relayWheel = (event) => {
    if (event.data?.type !== "team-mockup-wheel") return;
    window.scrollBy({
      top: Number(event.data.deltaY) || 0,
      left: Number(event.data.deltaX) || 0,
      behavior: "auto",
    });
  };
  window.addEventListener("message", relayWheel);

  frames.forEach(prepareFrame);
}

export function setTeamMockupProgress(progress) {
  mockupProgress = clampProgress(progress);
  mockupFrames.forEach((frame) => applyFrameProgress(frame, mockupProgress));
}

export function initTeamOverview() {
  const sections = document.querySelectorAll("[data-team-overview], [data-team-mockup]");
  const mockup = document.querySelector("[data-team-mockup]");
  if (!sections.length) return;

  initTeamMockupFrames(mockup);

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-active"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting)),
    { threshold: .35 },
  );
  sections.forEach((section) => observer.observe(section));
}
