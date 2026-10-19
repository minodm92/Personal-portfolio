import { initRevealWithin } from "../../common/reveal.js";

export function initWorkTypes({ reduceMotion }) {
  initRevealWithin(document.querySelector(".work-types"), reduceMotion);
}
