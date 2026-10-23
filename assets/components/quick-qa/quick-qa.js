import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initQuickQa() {
  const section = document.querySelector("[data-quick-qa]");
  if (!section) return;

  const cleanups = [];
  section.querySelectorAll("[data-qa-item]").forEach((item) => {
    const button = item.querySelector(".quick-qa__toggle");
    const answer = item.querySelector(".quick-qa__answer");
    if (!button || !answer) return;

    let animation;
    const handleClick = () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      animation?.kill();

      if (isExpanded) {
        button.setAttribute("aria-expanded", "false");
        animation = gsap.to(answer, {
          height: 0,
          opacity: 0,
          duration: 0.28,
          ease: "power1.inOut",
          onComplete: () => {
            answer.hidden = true;
            gsap.set(answer, { clearProps: "height,opacity" });
            ScrollTrigger.refresh();
          },
        });
        return;
      }

      answer.hidden = false;
      button.setAttribute("aria-expanded", "true");
      gsap.set(answer, { height: 0, opacity: 0 });
      animation = gsap.to(answer, {
        height: "auto",
        opacity: 1,
        duration: 0.38,
        ease: "power1.out",
        onComplete: () => {
          gsap.set(answer, { clearProps: "height,opacity" });
          ScrollTrigger.refresh();
        },
      });
    };

    button.addEventListener("click", handleClick);
    cleanups.push(() => {
      button.removeEventListener("click", handleClick);
      animation?.kill();
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}
