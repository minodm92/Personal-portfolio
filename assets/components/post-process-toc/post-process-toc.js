import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { buildTableOfContentsTitleInkSvg } from "../horizontal-story/horizontal-story.js";

gsap.registerPlugin(ScrollTrigger);

export async function initPostProcessToc() {
  const sequence = document.querySelector("[data-personal-story-sequence]");
  const viewport = sequence?.querySelector("[data-personal-story-viewport]");
  const track = sequence?.querySelector("[data-personal-story-track]");
  const section = sequence?.querySelector("[data-post-process-toc]");
  const mockup = sequence?.querySelector(".personal-story-mockup");
  const title = section?.querySelector(".table-of-contents__year");
  const titleSvg = section?.querySelector("[data-toc-title-svg]");
  const topics = gsap.utils.toArray("[data-post-toc-topic]", section);
  const topicStarts = gsap.utils.toArray(".post-process-toc__topic-start", section);
  const topicEnds = gsap.utils.toArray(".post-process-toc__topic-end", section);
  const details = gsap.utils.toArray(".table-of-contents__period, .table-of-contents__direction > *", section);
  const number = section?.querySelector(".post-process-toc__number");
  if (!sequence || !viewport || !track || !section || !mockup || !title || !titleSvg || topics.length !== 3 || !number) return;

  const titleInk = await buildTableOfContentsTitleInkSvg(titleSvg, title);
  const totalInkLength = titleInk.lengths.reduce((total, length) => total + length, 0);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const restingShadow = "drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.2)) drop-shadow(0px 1px 1.5px rgba(0, 0, 0, 0.18))";

  gsap.set(topicStarts, { autoAlpha: reduceMotion ? 0 : 1, scale: 1 });
  gsap.set(topicEnds, { autoAlpha: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0 });
  gsap.set(titleInk.fills, { autoAlpha: reduceMotion ? 1 : 0 });
  gsap.set(titleInk.strokes, { autoAlpha: reduceMotion ? 0 : 1 });
  gsap.set(number, reduceMotion ? {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: restingShadow,
  } : {
    autoAlpha: 0,
    y: -150,
    scale: 1.8,
    filter: "drop-shadow(0px 40px 20px rgba(0, 0, 0, 0.05))",
    willChange: "transform,opacity,filter",
  });

  const media = gsap.matchMedia();
  media.add("(min-width: 64rem)", () => {
    const buildDistance = () => window.innerWidth * 1.45;
    const holdDistance = () => window.innerWidth * .2;
    const tocToMockup = () => Math.max(0, mockup.offsetLeft - section.offsetLeft);
    const horizontalDistance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const remainingDistance = () => Math.max(0, horizontalDistance() - tocToMockup());
    const outroHold = () => window.innerWidth * .3;
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sequence,
        start: "top top",
        end: () => `+=${buildDistance() + holdDistance() + horizontalDistance() + outroHold()}`,
        pin: viewport,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    if (reduceMotion) {
      timeline.to({}, { duration: buildDistance });
    } else {
      timeline.to(topicStarts, { autoAlpha: 0, scale: 0, duration: () => buildDistance() * .315, ease: "power2.in" });
      timeline.to(topicEnds, { autoAlpha: 1, scale: 1, duration: () => buildDistance() * .435, ease: "back.out(1.2)" });
    }

    if (reduceMotion || totalInkLength === 0) {
      timeline.to({}, { duration: () => buildDistance() * .216 });
    } else {
      titleInk.strokes.forEach((stroke, index) => {
        const duration = () => buildDistance() * .216 * (titleInk.lengths[index] / totalInkLength);
        timeline.to(stroke, { strokeDashoffset: 0, duration, ease: "power1.inOut" });
        timeline.to(titleInk.fills[index], { autoAlpha: 1, duration: () => duration() * .12 }, "<");
        timeline.to(stroke, { autoAlpha: 0, duration: () => duration() * .12 }, "<");
      });
    }

    timeline.fromTo(details, { autoAlpha: 0, y: 14 }, {
      autoAlpha: 1,
      y: 0,
      duration: () => buildDistance() * .1,
      stagger: () => buildDistance() * .012,
      ease: "power2.out",
    }, `-=${buildDistance() * .04}`);
    timeline.to(number, { autoAlpha: 1, y: 0, scale: 1, filter: restingShadow, duration: holdDistance, ease: "power3.out" });

    const [work, personal, project] = topics;
    const period = section.querySelector(".table-of-contents__period");
    const direction = section.querySelector(".table-of-contents__direction");
    timeline.add("toc-exit");
    timeline.to(track, { x: () => -tocToMockup(), duration: tocToMockup, ease: "power1.inOut" }, "toc-exit");
    timeline.to([work, number], { x: () => -section.clientWidth * .06, duration: tocToMockup, ease: "power1.inOut" }, "toc-exit");
    timeline.to(personal, { x: () => -section.clientWidth * .16, duration: tocToMockup, ease: "power1.inOut" }, "toc-exit");
    timeline.to(project, { x: () => -section.clientWidth * .28, duration: tocToMockup, ease: "power1.inOut" }, "toc-exit");
    timeline.to(period, { x: () => -section.clientWidth * .06, duration: tocToMockup, ease: "power1.inOut" }, "toc-exit");
    timeline.to(direction, { x: () => -section.clientWidth * .28, duration: tocToMockup, ease: "power1.inOut" }, "toc-exit");
    timeline.to(track, { x: () => -horizontalDistance(), duration: remainingDistance, ease: "none" });
    timeline.to({}, { duration: outroHold });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set([track, number, ...topics, ...topicStarts, ...topicEnds, ...titleInk.strokes, ...titleInk.fills, ...details], {
        clearProps: "transform,opacity,visibility,filter,willChange,strokeDasharray,strokeDashoffset",
      });
    };
  });

  media.add("(max-width: 63.99rem)", () => {
    gsap.set(topicStarts, { autoAlpha: 0 });
    gsap.set(topicEnds, { autoAlpha: 1, scale: 1 });
    gsap.set(titleInk.fills, { autoAlpha: 1 });
    gsap.set(titleInk.strokes, { autoAlpha: 0 });
    gsap.set([number, ...details], { autoAlpha: 1, y: 0, scale: 1, filter: "none" });

    return () => {
      gsap.set([number, ...topicStarts, ...topicEnds, ...titleInk.strokes, ...titleInk.fills, ...details], {
        clearProps: "transform,opacity,visibility,filter,willChange,strokeDasharray,strokeDashoffset",
      });
    };
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
