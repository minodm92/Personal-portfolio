import { initRevealWithin } from "../../common/reveal.js";

export function initApproach({ reduceMotion }) {
  initRevealWithin(document.querySelector(".approach"), reduceMotion);
}
