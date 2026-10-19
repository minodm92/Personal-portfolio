import { initRevealWithin } from "../../common/reveal.js";

export function initSkills({ reduceMotion }) {
  initRevealWithin(document.querySelector(".skills"), reduceMotion);
}
