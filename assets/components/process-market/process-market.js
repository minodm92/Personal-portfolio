import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const imageUrls = {
  "process-market-research.png": new URL("./process-market-research.png", import.meta.url).href,
  "process-market-competitor.png": new URL("./process-market-competitor.png", import.meta.url).href,
  "process-market-steep.png": new URL("./process-market-steep.png", import.meta.url).href,
  "process-market-3c.png": new URL("./process-market-3c.png", import.meta.url).href,
  "process-interview-original-figma.png": new URL("./process-interview-original-figma.png", import.meta.url).href,
  "process-interview-questions.png": new URL("./process-interview-questions.png", import.meta.url).href,
  "process-interview-summary.png": new URL("./process-interview-summary.png", import.meta.url).href,
  "process-interview-affinity.jpeg": new URL("./process-interview-affinity.jpeg", import.meta.url).href,
  "process-planning-persona.png": new URL("./process-planning-persona.png", import.meta.url).href,
  "process-planning-journey.png": new URL("./process-planning-journey.png", import.meta.url).href,
  "process-planning-lean-canvas.jpeg": new URL("./process-planning-lean-canvas.jpeg", import.meta.url).href,
  "process-structure-meeting.png": new URL("./process-structure-meeting.png", import.meta.url).href,
  "process-structure-menu-tree.png": new URL("./process-structure-menu-tree.png", import.meta.url).href,
  "process-structure-user-flow.png": new URL("./process-structure-user-flow.png", import.meta.url).href,
  "process-structure-requirements.png": new URL("./process-structure-requirements.png", import.meta.url).href,
  "process-direction-mode-board.png": new URL("./process-direction-mode-board.png", import.meta.url).href,
  "process-direction-design-mindmap.jpeg": new URL("./process-direction-design-mindmap.jpeg", import.meta.url).href,
  "process-screen-wireframe.png": new URL("./process-screen-wireframe.png", import.meta.url).href,
  "process-screen-design-system.png": new URL("./process-screen-design-system.png", import.meta.url).href,
  "process-screen-components.png": new URL("./process-screen-components.png", import.meta.url).href,
};

function initPanelButtons(panel) {
  const image = panel.querySelector("[data-market-image]");
  const buttons = [...panel.querySelectorAll("[data-market-image-src]")];
  const originalPreview = panel.querySelector("[data-market-original-preview]");
  if (!image || buttons.length === 0) return;

  buttons.forEach((button) => {
    const filename = button.dataset.marketImageSrc?.split("/").pop();
    if (imageUrls[filename]) button.dataset.marketImageSrc = imageUrls[filename];
  });

  panel.classList.add("has-selection");
  image.src = buttons[0].dataset.marketImageSrc;
  image.alt = buttons[0].dataset.marketImageAlt ?? "";
  panel.classList.toggle("is-original-selected", panel.classList.contains("process-market--par2"));
  if (originalPreview) originalPreview.hidden = false;

  buttons.forEach((button, index) => {
    button.classList.toggle("is-active", index === 0);
    button.setAttribute("aria-pressed", String(index === 0));
    const preload = new Image();
    preload.src = button.dataset.marketImageSrc;

    button.addEventListener("click", () => {
      panel.classList.add("has-selection");
      if (button.classList.contains("is-active")) return;

      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      image.classList.add("is-changing");
      window.setTimeout(() => {
        if (panel.classList.contains("process-market--par2")) panel.classList.toggle("is-original-selected", index === 0);
        if (originalPreview) originalPreview.hidden = index !== 0;
        image.src = button.dataset.marketImageSrc;
        image.alt = button.dataset.marketImageAlt ?? "";
        image.classList.remove("is-changing");
      }, 180);
    });
  });
}

export function initProcessMarket() {
  const sequence = document.querySelector("[data-process-market-sequence]");
  const viewport = sequence?.querySelector("[data-process-market-viewport]");
  const track = sequence?.querySelector("[data-process-market-track]");
  const panels = [...(sequence?.querySelectorAll("[data-market-panel]") ?? [])];
  if (!sequence || !viewport || !track || panels.length !== 6) return;

  panels.forEach(initPanelButtons);

  const media = gsap.matchMedia();
  media.add("(min-width: 64rem)", () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const introHold = () => window.innerHeight * 0.3;
    const outroHold = () => window.innerHeight * 0.5;
    const totalDistance = () => introHold() + distance() + outroHold();
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sequence,
        start: "top top",
        end: () => `+=${totalDistance()}`,
        pin: viewport,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    timeline.to({}, { duration: introHold });
    timeline.to(track, { x: () => -distance(), duration: distance() });
    timeline.to({}, { duration: outroHold });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set(track, { clearProps: "transform" });
    };
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
