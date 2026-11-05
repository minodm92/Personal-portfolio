const videoStates = new WeakMap();
const comparisonTimers = new WeakMap();
const LOADER_PLAYBACK_RATE = 8;
const VIDEO_SELECTOR = "[data-editorial-video], [data-brand-experience-video], [data-typography-video], [data-before-after-video], [data-before-after-result-video], [data-personal-mockup-video], [data-video-content-video]";
const STORY_VIDEO_SELECTOR = "[data-editorial-video], [data-brand-experience-video], [data-typography-video], [data-before-after-video], [data-before-after-result-video]";
const COMPARISON_DELAY = 2000;

function forwardRate(video, state) {
  return video.currentTime < state.loaderEnd ? LOADER_PLAYBACK_RATE : state.rate;
}

function playForward(video) {
  const state = videoStates.get(video);
  if (!state || !state.visible) return;
  video.playbackRate = forwardRate(video, state);
  video.play().catch(() => {});
}

function prepareVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  videoStates.set(video, {
    visible: false,
    rate: Number(video.dataset.playbackRate) || 1,
    loaderEnd: Number(video.dataset.loaderEnd) || 0,
    manual: video.hasAttribute("data-manual-playback"),
    manualRequested: false,
  });
  video.addEventListener("timeupdate", () => {
    const state = videoStates.get(video);
    if (!state) return;
    const nextRate = forwardRate(video, state);
    if (video.playbackRate !== nextRate) video.playbackRate = nextRate;
  });

}

function setComparisonState(section, playing) {
  if (!section?.classList.contains("story-figma--four")) return;

  const timer = comparisonTimers.get(section);
  if (timer) clearTimeout(timer);
  section.classList.remove("is-after-visible");
  syncComparisonAccessible(section);

  if (!playing) return;
  comparisonTimers.set(section, window.setTimeout(() => {
    section.classList.add("is-after-visible");
    syncComparisonAccessible(section);
    comparisonTimers.delete(section);
  }, COMPARISON_DELAY));
}

function syncComparisonAccessible(section) {
  const before = section?.querySelector(".story-figma__comparison-preview--before");
  const after = section?.querySelector(".story-figma__comparison-preview--after");
  if (!before || !after) return;
  const hovered = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    && section.querySelector(".story-figma__photo")?.matches(":hover");
  const afterVisible = section.classList.contains("is-after-visible") && !hovered;
  before.setAttribute("aria-hidden", String(afterVisible));
  after.setAttribute("aria-hidden", String(!afterVisible));
}

function initComparisonPreviews(section) {
  const screen = section?.querySelector(".story-figma__screen--comparison");
  if (!screen) return;
  const updateSize = () => {
    screen.style.setProperty("--comparison-viewport-height", `${screen.clientHeight}px`);
    screen.querySelectorAll(".story-figma__comparison-preview").forEach((preview) => {
      const image = preview.querySelector("img");
      if (!image?.naturalWidth) return;
      const travel = image.naturalHeight / image.naturalWidth * screen.clientWidth - screen.clientHeight;
      preview.style.setProperty("--comparison-scroll-duration", `${Math.max(8, travel / 90)}s`);
    });
  };
  new ResizeObserver(updateSize).observe(screen);
  screen.querySelectorAll("img").forEach((image) => image.addEventListener("load", updateSize));
  const monitor = section.querySelector(".story-figma__photo");
  monitor?.addEventListener("pointerenter", () => syncComparisonAccessible(section));
  monitor?.addEventListener("pointerleave", () => syncComparisonAccessible(section));
  updateSize();
}

function initMockupPreviews(mockup) {
  mockup?.querySelectorAll(".team-mockup__desktop-screen, .team-mockup__phone-screen").forEach((screen) => {
    const updateSize = () => {
      screen.style.setProperty("--mockup-viewport-height", `${screen.clientHeight}px`);
      screen.querySelectorAll(".team-mockup__page-preview").forEach((preview) => {
        const image = preview.querySelector("img");
        if (!image?.naturalWidth) return;
        const travel = image.naturalHeight / image.naturalWidth * screen.clientWidth - screen.clientHeight;
        preview.style.setProperty("--mockup-scroll-duration", `${Math.max(8, travel / 90)}s`);
      });
    };
    new ResizeObserver(updateSize).observe(screen);
    screen.querySelectorAll("img").forEach((image) => image.addEventListener("load", updateSize));
    updateSize();
  });
  if (mockup && "IntersectionObserver" in window) {
    const readyObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      const ready = entry.intersectionRatio >= .95;
      const becameReady = ready && !entry.target.classList.contains("is-preview-ready");
      entry.target.classList.toggle("is-preview-ready", ready);
      if (becameReady) {
        const page = mockup.classList.contains("is-subpage-preview") ? "subpage" : "main";
        entry.target.querySelector(`.team-mockup__${page}-preview img`)
          ?.getAnimations().forEach((animation) => { animation.currentTime = 0; });
      }
    }), { threshold: [.95] });
    mockup.querySelectorAll(".team-mockup__desktop, .team-mockup__phone")
      .forEach((device) => readyObserver.observe(device));
  }
}

function setVideoPlayback(section, playing, selector = VIDEO_SELECTOR) {
  section?.querySelectorAll(selector).forEach((video) => {
    const state = videoStates.get(video);
    if (!state) return;
    state.visible = playing;

    if (!playing) {
      video.pause();
      return;
    }

    if (state.manual && !state.manualRequested) {
      video.pause();
      return;
    }

    playForward(video);
  });
}

function initVideoContentControls() {
  document.querySelectorAll("[data-video-content-toggle]").forEach((button) => {
    const panel = button.closest(".video-content");
    const video = panel?.querySelector("[data-video-content-video]");
    if (!video) {
      button.disabled = true;
      button.setAttribute("aria-label", "영상 준비 중");
      return;
    }

    const state = videoStates.get(video);
    if (!state) return;
    button.disabled = false;

    const updateButton = (playing) => {
      button.classList.toggle("is-playing", playing);
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "영상 일시정지" : "영상 재생");
    };

    updateButton(false);
    button.addEventListener("click", () => {
      if (video.paused) {
        state.manualRequested = true;
        state.visible = true;
        playForward(video);
        return;
      }

      state.manualRequested = false;
      video.pause();
    });
    video.addEventListener("play", () => updateButton(true));
    video.addEventListener("pause", () => updateButton(false));
  });
}

export function setTeamMockupPreviewActive(active, subpage = false) {
  const mockup = document.querySelector("[data-team-mockup]");
  if (!mockup) return;
  const playingClass = subpage ? "is-subpage-preview-playing" : "is-main-preview-playing";
  const starting = active && !mockup.classList.contains(playingClass);
  mockup.classList.toggle("is-subpage-preview", subpage);
  mockup.classList.toggle("is-main-preview-playing", active && !subpage);
  mockup.classList.toggle("is-subpage-preview-playing", active && subpage);
  if (starting) mockup.querySelectorAll(`.team-mockup__${subpage ? "subpage" : "main"}-preview img`)
    .forEach((image) => image.getAnimations().forEach((animation) => { animation.currentTime = 0; }));
  mockup.querySelector(".team-mockup__desktop-screen .team-mockup__main-preview")?.setAttribute("aria-hidden", String(subpage));
  mockup.querySelector(".team-mockup__desktop-screen .team-mockup__subpage-preview")?.setAttribute("aria-hidden", String(!subpage));
}

export function initTeamOverview() {
  const sections = document.querySelectorAll("[data-team-overview], [data-team-mockup], [data-team-subpage]");
  const mockup = document.querySelector("[data-team-mockup]");
  const storySections = [...new Set(
    [...document.querySelectorAll(STORY_VIDEO_SELECTOR)]
      .map((video) => video.closest(".story-figma"))
      .filter(Boolean),
  )];
  const personalSections = [...new Set(
    [...document.querySelectorAll("[data-personal-mockup-video]")]
      .map((video) => video.closest("[data-personal-story-panel]"))
      .filter(Boolean),
  )];
  const videoContentSections = [...new Set(
    [...document.querySelectorAll("[data-video-content-video]")]
      .map((video) => video.closest(".video-content"))
      .filter(Boolean),
  )];
  const comparisonSection = document.querySelector(".story-figma--four");
  const comparisonMonitor = comparisonSection?.querySelector(".story-figma__photo");
  const videos = document.querySelectorAll(VIDEO_SELECTOR);
  if (!sections.length) return;

  videos.forEach(prepareVideo);
  initVideoContentControls();
  initComparisonPreviews(comparisonSection);
  initMockupPreviews(mockup);

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-active"));
    mockup?.querySelectorAll(".team-mockup__desktop, .team-mockup__phone")
      .forEach((device) => device.classList.add("is-preview-ready"));
    setTeamMockupPreviewActive(true);
    storySections.forEach((section) => setVideoPlayback(section, true));
    personalSections.forEach((section) => setVideoPlayback(section, true));
    videoContentSections.forEach((section) => setVideoPlayback(section, true));
    setComparisonState(comparisonSection, true);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
      // The desktop sticker timeline owns playback, including preview and reverse entry.
      if (entry.target === mockup && !mockup.closest(".is-scroll-controlled")) setTeamMockupPreviewActive(entry.intersectionRatio >= .35);
      if (storySections.includes(entry.target)) setVideoPlayback(entry.target, entry.isIntersecting);
      if (personalSections.includes(entry.target)) setVideoPlayback(entry.target, entry.isIntersecting);
      if (videoContentSections.includes(entry.target)) setVideoPlayback(entry.target, entry.isIntersecting);
    }),
    { threshold: .35 },
  );
  sections.forEach((section) => observer.observe(section));
  storySections.forEach((section) => observer.observe(section));
  personalSections.forEach((section) => observer.observe(section));
  videoContentSections.forEach((section) => observer.observe(section));

  if (comparisonMonitor) {
    const comparisonObserver = new IntersectionObserver(
      ([entry]) => setComparisonState(comparisonSection, entry.intersectionRatio >= .35),
      { threshold: .35 },
    );
    comparisonObserver.observe(comparisonMonitor);
  }
}
