import { initRevealWithin } from "../../common/reveal.js";

export function initContact({ reduceMotion }) {
  initRevealWithin(document.querySelector(".contact"), reduceMotion);
}
