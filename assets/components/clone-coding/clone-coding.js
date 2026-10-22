import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initCloneCoding() {
  const section = document.querySelector(".clone-coding");
  const cards = section?.querySelector(".clone-coding__cards");
  if (!section || !cards) return;

  const media = gsap.matchMedia();
  media.add("(min-width: 64rem) and (prefers-reduced-motion: no-preference)", () => {
    const sideInset = () => section.clientWidth * (122 / 1920);
    const horizontalDistance = () => Math.max(
      0,
      cards.scrollWidth - (section.clientWidth - sideInset() * 2),
    );
    const holdDistance = () => section.clientHeight * .5;
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${horizontalDistance() + holdDistance() * 2}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    timeline.to({}, { duration: holdDistance });
    timeline.to(cards, {
      x: () => -horizontalDistance(),
      duration: horizontalDistance,
    });
    timeline.to({}, { duration: holdDistance });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set(cards, { clearProps: "transform" });
    };
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
