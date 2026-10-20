const videoStates = new WeakMap();
const LOADER_PLAYBACK_RATE = 8;

function forwardRate(video, state) {
  return video.currentTime < state.loaderEnd ? LOADER_PLAYBACK_RATE : state.rate;
}

function cancelReverse(video) {
  const state = videoStates.get(video);
  if (!state?.frame) return;
  cancelAnimationFrame(state.frame);
  state.frame = 0;
}

function playForward(video) {
  const state = videoStates.get(video);
  if (!state || !state.visible) return;
  cancelReverse(video);
  state.direction = "forward";
  video.playbackRate = forwardRate(video, state);
  video.play().catch(() => {});
}

function playReverse(video) {
  const state = videoStates.get(video);
  if (!state || !state.visible) return;
  video.pause();
  cancelReverse(video);
  state.direction = "reverse";
  state.previousTime = performance.now();

  const step = (now) => {
    if (!state.visible || state.direction !== "reverse") {
      state.frame = 0;
      return;
    }

    const elapsed = Math.min(.1, (now - state.previousTime) / 1000);
    state.previousTime = now;
    const reverseRate = video.currentTime <= state.loaderEnd ? LOADER_PLAYBACK_RATE : state.rate;
    video.currentTime = Math.max(0, video.currentTime - elapsed * reverseRate);

    if (video.currentTime <= .04) {
      video.currentTime = 0;
      state.frame = 0;
      playForward(video);
      return;
    }
    state.frame = requestAnimationFrame(step);
  };

  state.frame = requestAnimationFrame(step);
}

function prepareVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.loop = false;
  videoStates.set(video, {
    direction: "forward",
    visible: false,
    frame: 0,
    previousTime: 0,
    rate: Number(video.dataset.playbackRate) || 1,
    loaderEnd: Number(video.dataset.loaderEnd) || 0,
  });
  video.addEventListener("ended", () => playReverse(video));
  video.addEventListener("timeupdate", () => {
    const state = videoStates.get(video);
    if (!state || state.direction !== "forward") return;
    const nextRate = forwardRate(video, state);
    if (video.playbackRate !== nextRate) video.playbackRate = nextRate;
  });

}

function setVideoPlayback(section, playing) {
  section?.querySelectorAll("[data-team-mockup-video]").forEach((video) => {
    const state = videoStates.get(video);
    if (!state) return;
    state.visible = playing;

    if (!playing) {
      video.pause();
      cancelReverse(video);
      return;
    }

    if (state.direction === "reverse") playReverse(video);
    else playForward(video);
  });
}

export function setTeamMockupProgress() {
  // Retained for the horizontal-story integration. Videos play independently.
}

export function initTeamOverview() {
  const sections = document.querySelectorAll("[data-team-overview], [data-team-mockup]");
  const mockup = document.querySelector("[data-team-mockup]");
  if (!sections.length) return;

  mockup?.querySelectorAll("[data-team-mockup-video]").forEach(prepareVideo);

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-active"));
    setVideoPlayback(mockup, true);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
      if (entry.target === mockup) setVideoPlayback(mockup, entry.isIntersecting);
    }),
    { threshold: .35 },
  );
  sections.forEach((section) => observer.observe(section));
}
