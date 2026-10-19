import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initHorizontalStory() {
  const sequence = document.querySelector("[data-intro-story-sequence]");
  const sequenceViewport = sequence?.querySelector("[data-sequence-viewport]");
  const sequenceTrack = sequence?.querySelector("[data-sequence-track]");
  const tableOfContents = sequence?.querySelector("[data-table-of-contents]");
  const tocStage = tableOfContents?.querySelector(".table-of-contents__stage");
  const tocTopics = gsap.utils.toArray("[data-toc-topic]", tableOfContents);
  const tocYearParts = gsap.utils.toArray(".table-of-contents__year-part", tableOfContents);
  const tocDetails = gsap.utils.toArray(
    ".table-of-contents__number, .table-of-contents__period, .table-of-contents__direction > *",
    tableOfContents,
  );
  const tocNumber = tableOfContents?.querySelector(".table-of-contents__number");
  const tocPeriod = tableOfContents?.querySelector(".table-of-contents__period");
  const tocDirection = tableOfContents?.querySelector(".table-of-contents__direction");
  const teamOverview = sequence?.querySelector("[data-team-overview]");
  const section = document.querySelector("[data-horizontal-story]");
  const track = section?.querySelector("[data-horizontal-track]");
  const storyViewport = section?.querySelector(".horizontal-story__viewport");
  const line = section?.querySelector("[data-story-line]");
  const lineTrack = section?.querySelector("[data-story-line-track]");
  const lineSvg = section?.querySelector("[data-story-line-svg]");
  const lineDash = section?.querySelector("[data-story-line-dash]");
  const lineSolid = section?.querySelector("[data-story-line-solid]");
  const lineReveal = section?.querySelector("[data-story-line-reveal]");
  if (!sequence || !sequenceViewport || !sequenceTrack || !tableOfContents || !tocStage || tocTopics.length !== 3 || !tocNumber || !tocPeriod || !tocDirection || !teamOverview || !section || !track || !storyViewport || !line || !lineTrack || !lineSvg || !lineDash || !lineSolid || !lineReveal) return;

  const parallaxItems = gsap.utils.toArray("[data-story-parallax]", section);
  const media = gsap.matchMedia();

  const seededRandom = (index) => {
    const value = Math.sin((index + 1) * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const drawStoryLine = () => {
    const width = Math.max(1, track.scrollWidth);
    const height = Math.max(1, storyViewport.clientHeight);
    const minY = height * .25;
    const maxY = height * .75;
    const centerY = height * .5;
    const cycleWidth = Math.max(1, storyViewport.clientWidth);
    const cycleCount = Math.ceil(width / cycleWidth);
    const points = [{ x: 0, y: centerY }];

    for (let cycle = 0; cycle < cycleCount; cycle += 1) {
      const startX = cycle * cycleWidth;
      const endX = Math.min(width, startX + cycleWidth);
      const amplitude = height * (.13 + seededRandom(cycle) * .1);
      const direction = seededRandom(cycle + 37) > .5 ? 1 : -1;

      for (let quarter = 1; quarter <= 4; quarter += 1) {
        const progress = quarter / 4;
        const x = startX + cycleWidth * progress;
        if (x > width) break;
        const y = centerY + Math.sin(progress * Math.PI * 2) * amplitude * direction;
        points.push({
          x,
          y: Math.max(minY, Math.min(maxY, y)),
        });
      }

      if (points.at(-1)?.x < endX) {
        const progress = (endX - startX) / cycleWidth;
        const y = centerY + Math.sin(progress * Math.PI * 2) * amplitude * direction;
        points.push({ x: endX, y });
      }
    }

    const path = points.reduce((value, point, index) => {
      if (index === 0) return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      const previous = points[index - 1];
      const middleX = (previous.x + point.x) / 2;
      return `${value} C${middleX.toFixed(1)} ${previous.y.toFixed(1)} ${middleX.toFixed(1)} ${point.y.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    }, "");

    lineSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    lineDash.setAttribute("d", path);
    lineSolid.setAttribute("d", path);
    lineReveal.setAttribute("height", `${height}`);
  };

  const lineCursor = () => window.innerWidth * .34;
  const sizeLine = () => {
    lineTrack.style.width = `${track.scrollWidth}px`;
    drawStoryLine();
  };
  const revealLine = (offset = 0) => {
    const reveal = Math.min(track.scrollWidth, Math.max(0, offset + lineCursor()));
    lineReveal.setAttribute("width", `${reveal}`);
  };

  media.add("(min-width: 64rem)", () => {
    // The table of contents, overview, and story share one pinned horizontal journey.
    const distance = () => Math.max(0, track.scrollWidth + 1);
    const tocBuild = () => window.innerWidth * 1.45;
    const tocHold = () => window.innerWidth * .2;
    const tocToTeam = () => Math.max(0, teamOverview.offsetLeft - tableOfContents.offsetLeft);
    const teamHold = () => window.innerWidth * .55;
    const teamToStory = () => Math.max(0, section.offsetLeft - teamOverview.offsetLeft);
    const totalDistance = () => tocBuild() + tocHold() + tocToTeam() + teamHold() + teamToStory() + distance();
    const lineState = { offset: 0 };
    const [work, team, project] = tocTopics;
    const workCenterOffset = () => {
      const stageRect = tocStage.getBoundingClientRect();
      const workRect = work.getBoundingClientRect();
      return stageRect.left + stageRect.width / 2 - (workRect.left + workRect.width / 2);
    };
    const yearScripts = tocYearParts.filter((part) => part.matches(".table-of-contents__year-part--y, .table-of-contents__year-part--r"));
    const yearSerifs = tocYearParts.filter((part) => !yearScripts.includes(part));
    sizeLine();
    revealLine();
    const redrawLine = () => {
      sizeLine();
      revealLine(lineState.offset);
    };
    window.addEventListener("resize", redrawLine, { passive: true });
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: sequence,
        start: "top top",
        end: () => `+=${totalDistance()}`,
        pin: sequenceViewport,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    timeline.fromTo(
      work,
      { autoAlpha: 0, x: workCenterOffset, scale: .42 },
      { autoAlpha: 1, x: workCenterOffset, scale: 1.08, duration: () => tocBuild() * .25, ease: "power3.out" },
    );
    timeline.to(work, { x: 0, scale: 1, duration: () => tocBuild() * .2, ease: "power2.inOut" });
    timeline.fromTo(
      team,
      { autoAlpha: 0, y: () => tocStage.clientHeight * .24, scale: .68 },
      { autoAlpha: 1, y: 0, scale: 1, duration: () => tocBuild() * .23, ease: "power3.out" },
      `-=${tocBuild() * .08}`,
    );
    timeline.fromTo(
      project,
      { autoAlpha: 0, x: () => tocStage.clientWidth * .3, scale: .74 },
      { autoAlpha: 1, x: 0, scale: 1, duration: () => tocBuild() * .25, ease: "power3.out" },
      `-=${tocBuild() * .1}`,
    );
    timeline.fromTo(
      yearSerifs,
      { autoAlpha: 0, yPercent: 65 },
      { autoAlpha: 1, yPercent: 0, duration: () => tocBuild() * .16, stagger: () => tocBuild() * .018, ease: "power3.out" },
      `-=${tocBuild() * .08}`,
    );
    timeline.fromTo(
      yearScripts,
      { autoAlpha: 0, scale: .55, rotation: 4 },
      { autoAlpha: 1, scale: 1, rotation: 0, duration: () => tocBuild() * .18, stagger: () => tocBuild() * .025, ease: "back.out(1.25)" },
      "<",
    );
    timeline.fromTo(
      tocDetails,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: () => tocBuild() * .1, stagger: () => tocBuild() * .012, ease: "power2.out" },
      `-=${tocBuild() * .04}`,
    );
    timeline.to({}, { duration: tocHold() });

    timeline.add("toc-exit");
    timeline.to(sequenceTrack, { x: () => -teamOverview.offsetLeft, duration: tocToTeam(), ease: "power1.inOut" }, "toc-exit");
    timeline.to(
      [work, tocNumber],
      { x: () => -tocStage.clientWidth * .06, duration: tocToTeam(), ease: "power1.inOut" },
      "toc-exit",
    );
    timeline.to(
      team,
      { x: () => -tocStage.clientWidth * .16, duration: tocToTeam(), ease: "power1.inOut" },
      "toc-exit",
    );
    timeline.to(
      project,
      { x: () => -tocStage.clientWidth * .28, duration: tocToTeam(), ease: "power1.inOut" },
      "toc-exit",
    );
    timeline.to(
      tocPeriod,
      { x: () => -tocStage.clientWidth * .06, duration: tocToTeam(), ease: "power1.inOut" },
      "toc-exit",
    );
    timeline.to(
      tocDirection,
      { x: () => -tocStage.clientWidth * .28, duration: tocToTeam(), ease: "power1.inOut" },
      "toc-exit",
    );
    timeline.to({}, { duration: teamHold() });
    timeline.to(sequenceTrack, { x: () => -section.offsetLeft, duration: teamToStory(), ease: "power1.inOut" });
    timeline.add("story-scroll");
    timeline.to(track, { x: () => -distance(), duration: distance() }, "story-scroll");
    timeline.to(lineTrack, { x: () => -distance(), duration: distance() }, "story-scroll");
    timeline.to(
      lineState,
      {
        offset: () => distance(),
        duration: distance(),
        onUpdate: () => revealLine(lineState.offset),
      },
      "story-scroll",
    );
    timeline.fromTo(
      parallaxItems,
      { x: (_, item) => -window.innerWidth * (Number(item.dataset.storyParallax) || 0) * .12 },
      {
        x: (_, item) => window.innerWidth * (Number(item.dataset.storyParallax) || 0) * .12,
        duration: distance(),
      },
      "story-scroll",
    );

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set([sequenceTrack, track, lineTrack, tocDirection, ...tocTopics, ...tocYearParts, ...tocDetails, ...parallaxItems], { clearProps: "transform,opacity,visibility" });
      lineReveal.setAttribute("width", "0");
      lineTrack.style.removeProperty("width");
      window.removeEventListener("resize", redrawLine);
    };
  });

  media.add("(max-width: 63.99rem)", () => {
    const updateMobileLine = () => {
      sizeLine();
      lineTrack.style.transform = `translate3d(${-storyViewport.scrollLeft}px, 0, 0)`;
      revealLine(storyViewport.scrollLeft);
    };

    updateMobileLine();
    storyViewport.addEventListener("scroll", updateMobileLine, { passive: true });
    window.addEventListener("resize", updateMobileLine);

    return () => {
      storyViewport.removeEventListener("scroll", updateMobileLine);
      window.removeEventListener("resize", updateMobileLine);
      lineTrack.style.removeProperty("transform");
      lineReveal.setAttribute("width", "0");
      lineTrack.style.removeProperty("width");
    };
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
