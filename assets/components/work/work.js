import { initRevealWithin } from "../../common/reveal.js";

export function initWork({ reduceMotion }) {
  const work = document.querySelector(".work");
  initRevealWithin(work, reduceMotion);
  if (!work || reduceMotion.matches) return;

  let ticking = false;
  const update = () => {
    work.querySelectorAll(".device-stage, .browser-stage").forEach((media) => {
      const rect = media.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      media.style.setProperty("--media-shift", `${Math.max(-18, Math.min(18, centerOffset * -0.025))}px`);
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}
