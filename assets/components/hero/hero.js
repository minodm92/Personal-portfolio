import { initMagneticWithin } from "../../common/magnetic.js";
import { initRevealWithin } from "../../common/reveal.js";

export function initHero({ reduceMotion }) {
  const hero = document.querySelector(".hero");
  initRevealWithin(hero, reduceMotion);
  initMagneticWithin(hero, reduceMotion);

  if (!hero || reduceMotion.matches) return;
  let ticking = false;

  const update = () => {
    const scrollY = window.scrollY;
    document.documentElement.style.setProperty("--hero-shift", `${Math.min(90, scrollY * 0.14)}px`);
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}
