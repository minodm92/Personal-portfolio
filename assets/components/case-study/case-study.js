import { initRevealWithin } from "../../common/reveal.js";

export function initCaseStudy({ reduceMotion }) {
  const section = document.querySelector(".case-study");
  initRevealWithin(section, reduceMotion);
  if (!section) return;

  const items = section.querySelectorAll(".process-list li");
  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    items.forEach((item) => item.classList.add("is-active"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting)),
    { rootMargin: "-38% 0px -38%", threshold: 0 },
  );
  items.forEach((item) => observer.observe(item));
}
