const videoStates = new WeakMap();
const comparisonTimers = new WeakMap();
const LOADER_PLAYBACK_RATE = 8;
const VIDEO_SELECTOR = "[data-team-mockup-video], [data-editorial-video], [data-brand-experience-video], [data-typography-video], [data-before-after-video], [data-before-after-result-video], [data-personal-mockup-video]";
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

    playForward(video);
  });
}

export function setTeamMockupProgress() {
  // Retained for the horizontal-story integration. Videos play independently.
}

export function initTeamOverview() {
  const sections = document.querySelectorAll("[data-team-overview], [data-team-mockup]");
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
  const comparisonSection = document.querySelector(".story-figma--four");
  const comparisonMonitor = comparisonSection?.querySelector(".story-figma__photo");
  const videos = document.querySelectorAll(VIDEO_SELECTOR);
  if (!sections.length) return;

  videos.forEach(prepareVideo);

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-active"));
    setVideoPlayback(mockup, true);
    storySections.forEach((section) => setVideoPlayback(section, true));
    personalSections.forEach((section) => setVideoPlayback(section, true));
    setComparisonState(comparisonSection, true);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
      if (entry.target === mockup) setVideoPlayback(mockup, entry.isIntersecting);
      if (storySections.includes(entry.target)) setVideoPlayback(entry.target, entry.isIntersecting);
      if (personalSections.includes(entry.target)) setVideoPlayback(entry.target, entry.isIntersecting);
    }),
    { threshold: .35 },
  );
  sections.forEach((section) => observer.observe(section));
  storySections.forEach((section) => observer.observe(section));
  personalSections.forEach((section) => observer.observe(section));

  if (comparisonMonitor) {
    const comparisonObserver = new IntersectionObserver(
      ([entry]) => setComparisonState(comparisonSection, entry.isIntersecting),
      { threshold: .8 },
    );
    comparisonObserver.observe(comparisonMonitor);
  }
}
