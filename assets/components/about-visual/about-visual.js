import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAboutVisual() {
  const section = document.querySelector("[data-about-visual]");
  const viewport = section?.querySelector(".about-visual__viewport");
  if (!section || !viewport) return;

  const pin = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${window.innerHeight * 0.2}`,
    pin: viewport,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  });

  return () => pin.kill();
}
