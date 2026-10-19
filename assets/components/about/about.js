import { initRevealWithin } from "../../common/reveal.js";

export function initAbout({ reduceMotion }) {
  const about = document.querySelector(".about");
  initRevealWithin(about, reduceMotion);
  if (!about || reduceMotion.matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const poster = about.querySelector(".about__poster");
  poster?.addEventListener("pointermove", (event) => {
    const rect = poster.getBoundingClientRect();
    poster.style.setProperty("--tilt-x", `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`);
    poster.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 5}deg`);
  });
  poster?.addEventListener("pointerleave", () => {
    poster.style.setProperty("--tilt-x", "0deg");
    poster.style.setProperty("--tilt-y", "0deg");
  });
}
