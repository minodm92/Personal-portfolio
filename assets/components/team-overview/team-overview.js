const videoStates = new WeakMap();
const comparisonTimers = new WeakMap();
const LOADER_PLAYBACK_RATE = 8;
const VIDEO_SELECTOR = "[data-team-mockup-video], [data-editorial-video], [data-brand-experience-video], [data-typography-video], [data-before-after-video], [data-before-after-result-video], [data-personal-mockup-video], [data-video-content-video]";
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

  if (!playing) return;
  comparisonTimers.set(section, window.setTimeout(() => {
    section.classList.add("is-after-visible");
    comparisonTimers.delete(section);
  }, COMPARISON_DELAY));
}

function setVideoPlayback(section, playing) {
  section?.querySelectorAll(VIDEO_SELECTOR).forEach((video) => {
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

export function setTeamMockupPreviewActive(active) {
  const mockup = document.querySelector("[data-team-mockup]");
  if (mockup) setVideoPlayback(mockup, active);
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

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-active"));
    setVideoPlayback(mockup, true);
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
      if (entry.target === mockup && !mockup.closest(".is-scroll-controlled")) setVideoPlayback(mockup, entry.isIntersecting);
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
      ([entry]) => setComparisonState(comparisonSection, entry.isIntersecting),
      { threshold: .8 },
    );
    comparisonObserver.observe(comparisonMonitor);
  }
}
