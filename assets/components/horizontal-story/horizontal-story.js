import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setTeamMockupProgress } from "../team-overview/team-overview.js";

gsap.registerPlugin(ScrollTrigger);

const svgNamespace = "http://www.w3.org/2000/svg";

function splitPathIntoGlyphs(sourcePath, glyphCount, svg) {
  const pathData = sourcePath.getAttribute("d") ?? "";
  if (glyphCount === 1) return [pathData];

  const subpaths = pathData.match(/[Mm][^Mm]*/g) ?? [pathData];
  const measurementGroup = document.createElementNS(svgNamespace, "g");
  measurementGroup.style.visibility = "hidden";
  svg.append(measurementGroup);

  const measured = subpaths.map((data) => {
    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("d", data);
    measurementGroup.append(path);
    const box = path.getBBox();
    return { data, center: box.x + box.width / 2 };
  });
  measurementGroup.remove();

  const sorted = [...measured].sort((a, b) => a.center - b.center);
  const boundaries = sorted
    .slice(0, -1)
    .map((item, index) => ({ index, gap: sorted[index + 1].center - item.center }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, glyphCount - 1)
    .map(({ index }) => index)
    .sort((a, b) => a - b);

  const groups = [];
  let start = 0;
  boundaries.forEach((boundary) => {
    groups.push(sorted.slice(start, boundary + 1));
    start = boundary + 1;
  });
  groups.push(sorted.slice(start));

  return groups.map((group) => group.map(({ data }) => data).join(""));
}

export async function buildTableOfContentsTitleInkSvg(svg, title) {
  if (!svg || !title) return { strokes: [], fills: [], lengths: [] };

  try {
    const assetUrl = new URL("../table-of-contents/toc-title.svg", import.meta.url);
    const response = await fetch(assetUrl);
    if (!response.ok) throw new Error(`Title SVG request failed: ${response.status}`);

    const documentSvg = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
    const sourcePaths = [...documentSvg.querySelectorAll("path")];
    const findPath = (id) => sourcePaths.find((path) => path.id === id);
    const orderedPathGroups = [
      { path: findPath("T"), glyphCount: 1 },
      { path: findPath("hing"), glyphCount: 4 },
      {
        path: sourcePaths.find((path) => path.id.startsWith("i") && path.id.endsWith("d") && path.id !== "hing"),
        glyphCount: 3,
      },
      { path: findPath("M"), glyphCount: 1 },
      { path: findPath("ade"), glyphCount: 3 },
    ];

    if (orderedPathGroups.some(({ path }) => !path)) throw new Error("Title SVG paths are incomplete");

    const glyphPathData = orderedPathGroups.flatMap(({ path, glyphCount }) => (
      splitPathIntoGlyphs(path, glyphCount, svg)
    ));
    if (glyphPathData.length !== 12) throw new Error("Title SVG could not be split into 12 glyphs");

    const fillGroup = document.createElementNS(svgNamespace, "g");
    const strokeGroup = document.createElementNS(svgNamespace, "g");
    const fills = [];
    const strokes = [];

    glyphPathData.forEach((data) => {
      const fill = document.createElementNS(svgNamespace, "path");
      const stroke = document.createElementNS(svgNamespace, "path");
      fill.setAttribute("d", data);
      stroke.setAttribute("d", data);
      fill.setAttribute("class", "table-of-contents__title-fill");
      stroke.setAttribute("class", "table-of-contents__title-stroke");
      fill.style.opacity = "0";
      fillGroup.append(fill);
      strokeGroup.append(stroke);
      fills.push(fill);
      strokes.push(stroke);
    });

    svg.replaceChildren(fillGroup, strokeGroup);
    const lengths = strokes.map((path) => path.getTotalLength());
    strokes.forEach((path, index) => {
      path.style.strokeDasharray = `${lengths[index]}`;
      path.style.strokeDashoffset = `${lengths[index]}`;
    });
    title.classList.add("is-svg-ready");
    return { strokes, fills, lengths };
  } catch (error) {
    console.warn("Table of contents title SVG could not be initialized.", error);
    return { strokes: [], fills: [], lengths: [] };
  }
}

export async function initHorizontalStory() {
  const sequence = document.querySelector("[data-intro-story-sequence]");
  const sequenceViewport = sequence?.querySelector("[data-sequence-viewport]");
  const sequenceTrack = sequence?.querySelector("[data-sequence-track]");
  const tableOfContents = sequence?.querySelector("[data-table-of-contents]");
  const tocStage = tableOfContents?.querySelector(".table-of-contents__stage");
  const tocTitle = tableOfContents?.querySelector(".table-of-contents__year");
  const tocTitleSvg = tableOfContents?.querySelector("[data-toc-title-svg]");
  const tocTopics = gsap.utils.toArray("[data-toc-topic]", tableOfContents);
  const tocTopicBefores = gsap.utils.toArray(".table-of-contents__topic-before", tableOfContents);
  const tocTopicAfters = gsap.utils.toArray(".table-of-contents__topic-after", tableOfContents);
  const tocYearParts = gsap.utils.toArray(".table-of-contents__year-part", tableOfContents);
  const tocDetails = gsap.utils.toArray(
    ".table-of-contents__period, .table-of-contents__direction > *",
    tableOfContents,
  );
  const tocNumber = tableOfContents?.querySelector(".table-of-contents__number");
  const tocPeriod = tableOfContents?.querySelector(".table-of-contents__period");
  const tocDirection = tableOfContents?.querySelector(".table-of-contents__direction");
  const teamOverview = sequence?.querySelector("[data-team-overview]");
  const teamExitVisual = teamOverview?.querySelector(".team-overview__visual");
  const teamExitHeading = teamOverview?.querySelector(".team-overview__heading");
  const teamExitSummary = teamOverview?.querySelector(".team-overview__summary");
  const teamExitMeta = teamOverview?.querySelector(".team-overview__meta");
  const teamMockup = sequence?.querySelector("[data-team-mockup]");
  const mockupExitVisual = teamMockup?.querySelector(".team-mockup__visual");
  const mockupExitHeading = teamMockup?.querySelector(".team-mockup__heading");
  const mockupExitSummary = teamMockup?.querySelector(".team-mockup__summary");
  const mockupExitLink = teamMockup?.querySelector(".team-mockup__link");
  const section = document.querySelector("[data-horizontal-story]");
  const track = section?.querySelector("[data-horizontal-track]");
  const storyViewport = section?.querySelector(".horizontal-story__viewport");
  const line = section?.querySelector("[data-story-line]");
  const lineTrack = section?.querySelector("[data-story-line-track]");
  const lineSvg = section?.querySelector("[data-story-line-svg]");
  const lineDash = section?.querySelector("[data-story-line-dash]");
  const lineSolid = section?.querySelector("[data-story-line-solid]");
  const lineReveal = section?.querySelector("[data-story-line-reveal]");
  if (!sequence || !sequenceViewport || !sequenceTrack || !tableOfContents || !tocStage || tocTopics.length !== 3 || !tocNumber || !tocPeriod || !tocDirection || !teamOverview || !teamExitVisual || !teamExitHeading || !teamExitSummary || !teamExitMeta || !teamMockup || !mockupExitVisual || !mockupExitHeading || !mockupExitSummary || !mockupExitLink || !section || !track || !storyViewport || !line || !lineTrack || !lineSvg || !lineDash || !lineSolid || !lineReveal) return;

  const parallaxItems = gsap.utils.toArray("[data-story-parallax]", section);
  const titleInk = await buildTableOfContentsTitleInkSvg(tocTitleSvg, tocTitle);
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
    const distance = () => Math.max(0, track.scrollWidth - storyViewport.clientWidth);
    const tocBuild = () => window.innerWidth * 1.45;
    const tocHold = () => window.innerWidth * .2;
    const tocToTeam = () => Math.max(0, teamOverview.offsetLeft - tableOfContents.offsetLeft);
    const teamHold = () => window.innerWidth * .55;
    const teamToMockup = () => Math.max(0, teamMockup.offsetLeft - teamOverview.offsetLeft);
    const mockupHold = () => window.innerWidth * .55;
    const mockupToStory = () => Math.max(0, section.offsetLeft - teamMockup.offsetLeft);
    const outroHold = () => window.innerWidth * .3;
    const totalDistance = () => tocBuild() + tocHold() + tocToTeam() + teamHold() + teamToMockup() + mockupHold() + mockupToStory() + distance() + outroHold();
    const lineState = { offset: 0 };
    const mockupScrollState = { progress: 0 };
    const [work, team, project] = tocTopics;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const totalInkLength = titleInk.lengths.reduce((total, length) => total + length, 0);
    const numberRestingShadow = "drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.2)) drop-shadow(0px 1px 1.5px rgba(0, 0, 0, 0.18))";
    gsap.set(tocTopicBefores, { autoAlpha: reduceMotion ? 0 : 1, scale: 1 });
    gsap.set(tocTopicAfters, { autoAlpha: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0 });
    gsap.set(titleInk.fills, { autoAlpha: reduceMotion ? 1 : 0 });
    gsap.set(titleInk.strokes, { autoAlpha: reduceMotion ? 0 : 1 });
    gsap.set(tocNumber, reduceMotion ? {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: numberRestingShadow,
    } : {
      autoAlpha: 0,
      y: -150,
      scale: 1.8,
      filter: "drop-shadow(0px 40px 20px rgba(0, 0, 0, 0.05))",
      willChange: "transform,opacity,filter",
    });
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

    if (reduceMotion) {
      timeline.to({}, { duration: () => tocBuild() * .75 });
    } else {
      timeline.to(tocTopicBefores, {
        autoAlpha: 0,
        scale: 0,
        duration: () => tocBuild() * .315,
        ease: "power2.in",
      });
      timeline.to(tocTopicAfters, {
        autoAlpha: 1,
        scale: 1,
        duration: () => tocBuild() * .435,
        ease: "back.out(1.2)",
      });
    }
    if (reduceMotion || totalInkLength === 0) {
      timeline.to({}, { duration: () => tocBuild() * .216 });
    } else {
      titleInk.strokes.forEach((stroke, index) => {
        const durationRatio = .216 * (titleInk.lengths[index] / totalInkLength);
        const fillDurationRatio = durationRatio * .12;
        timeline.to(stroke, {
          strokeDashoffset: 0,
          duration: () => tocBuild() * durationRatio,
          ease: "power1.inOut",
        });
        timeline.to(titleInk.fills[index], {
          autoAlpha: 1,
          duration: () => tocBuild() * fillDurationRatio,
          ease: "none",
        }, `-=${tocBuild() * fillDurationRatio}`);
        timeline.to(stroke, {
          autoAlpha: 0,
          duration: () => tocBuild() * fillDurationRatio,
          ease: "none",
        }, "<");
      });
    }
    timeline.fromTo(
      tocDetails,
      { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: () => tocBuild() * .1, stagger: () => tocBuild() * .012, ease: "power2.out" },
      `-=${tocBuild() * .04}`,
    );
    if (reduceMotion) {
      timeline.to({}, { duration: tocHold() });
    } else {
      timeline.to(tocNumber, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: numberRestingShadow,
        duration: tocHold,
        ease: "power3.out",
      });
    }

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
    timeline.add("team-exit");
    timeline.to(sequenceTrack, { x: () => -teamMockup.offsetLeft, duration: teamToMockup(), ease: "power1.inOut" }, "team-exit");
    timeline.to(
      teamExitVisual,
      { x: () => -teamOverview.clientWidth * .16, duration: teamToMockup(), ease: "power1.inOut" },
      "team-exit",
    );
    timeline.to(
      teamExitHeading,
      { x: () => -teamOverview.clientWidth * .11, duration: teamToMockup(), ease: "power1.inOut" },
      "team-exit",
    );
    timeline.to(
      [teamExitSummary, teamExitMeta],
      { x: () => -teamOverview.clientWidth * .08, duration: teamToMockup(), ease: "power1.inOut" },
      "team-exit",
    );
    timeline.to(mockupScrollState, {
      progress: 1,
      duration: mockupHold(),
      ease: "none",
      onUpdate: () => setTeamMockupProgress(mockupScrollState.progress),
    });
    timeline.add("mockup-exit");
    timeline.to(sequenceTrack, { x: () => -section.offsetLeft, duration: mockupToStory(), ease: "power1.inOut" }, "mockup-exit");
    timeline.to(
      mockupExitVisual,
      { x: () => -teamMockup.clientWidth * .16, duration: mockupToStory(), ease: "power1.inOut" },
      "mockup-exit",
    );
    timeline.to(
      mockupExitHeading,
      { x: () => -teamMockup.clientWidth * .11, duration: mockupToStory(), ease: "power1.inOut" },
      "mockup-exit",
    );
    timeline.to(
      [mockupExitSummary, mockupExitLink],
      { x: () => -teamMockup.clientWidth * .08, duration: mockupToStory(), ease: "power1.inOut" },
      "mockup-exit",
    );
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
    timeline.to({}, { duration: outroHold });

    return () => {
      timeline.scrollTrigger?.kill();
      timeline.kill();
      gsap.set([sequenceTrack, track, lineTrack, tocDirection, tocNumber, teamExitVisual, teamExitHeading, teamExitSummary, teamExitMeta, mockupExitVisual, mockupExitHeading, mockupExitSummary, mockupExitLink, ...tocTopics, ...tocTopicBefores, ...tocTopicAfters, ...tocYearParts, ...titleInk.strokes, ...titleInk.fills, ...tocDetails, ...parallaxItems], { clearProps: "transform,opacity,visibility,filter,willChange,strokeDasharray,strokeDashoffset" });
      lineReveal.setAttribute("width", "0");
      lineTrack.style.removeProperty("width");
      setTeamMockupProgress(0);
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
