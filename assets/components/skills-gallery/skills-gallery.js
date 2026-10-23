import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const skillGroups = [
  { section: "DESIGN", skills: [["Figma", "figma"], ["Photoshop", "photoshop"], ["Illustrator", "illustrator"]] },
  { section: "WORKFLOW", skills: [["Git", "git"], ["GitHub", "github"], ["Vercel", "vercel"]] },
  { section: "FRONTEND", skills: [["HTML", "html"], ["CSS", "css"], ["SCSS", "scss"], ["JavaScript", "javascript"], ["React", "react"]] },
  { section: "INTERACTION", skills: [["GSAP", "gsap"], ["ScrollTrigger", "scrolltrigger"], ["Scrolla.js", "scrolla"]] },
  { section: "AI TOOLS", skills: [["ChatGPT", "chatgpt"], ["Gemini", "gemini"], ["Claude", "claude"]] },
  { section: "VIDEO", skills: [["Premiere Pro", "premiere"], ["After Effects", "aftereffects"], ["CapCut", "capcut"]] },
];

const skillItems = skillGroups.flatMap(({ section, skills }) =>
  skills.map(([name, mark]) => ({ section, name, mark })),
);

const markMarkup = {
  figma: `<svg viewBox="0 0 100 150" aria-hidden="true"><path fill="#f24e1e" d="M20 15a15 15 0 0 1 15-15h30v30H35a15 15 0 0 1-15-15Z"/><path fill="#ff7262" d="M65 0h15a15 15 0 0 1 0 30H65V0Z"/><path fill="#a259ff" d="M20 45a15 15 0 0 1 15-15h30v30H35a15 15 0 0 1-15-15Z"/><circle cx="80" cy="45" r="15" fill="#1abcfe"/><path fill="#0acf83" d="M20 75a15 15 0 0 1 15-15h30v30H35a15 15 0 0 1-15-15Z"/><path fill="#ff7262" d="M20 105a15 15 0 0 1 30 0v15a15 15 0 0 1-30 0v-15Z"/></svg>`,
  html: `<svg viewBox="0 0 100 112" aria-hidden="true"><path fill="currentColor" d="m5 5 8 90 37 12 37-12 8-90H5Z"/><path fill="#fff" d="M50 20h29l-2 10H50v10h26l-4 40-22 7V76l14-4 2-13H50V49h17l1-9H50V30h19l1-10H50v10Z"/><path fill="#fff" d="m25 40 2 9h23V40H25Zm4 19 2 19 19 6V73l-10-3-1-11H29Z"/></svg>`,
  css: `<svg viewBox="0 0 100 112" aria-hidden="true"><path fill="currentColor" d="m5 5 8 90 37 12 37-12 8-90H5Z"/><path fill="#fff" d="M50 20h29l-2 10H50v10h25l-4 39-21 7V75l13-4 2-12H50V49h16l1-9H50V30h18l1-10H50v10Z"/><path fill="#fff" d="m26 40 1 9h23v-9H26Zm3 19 2 19 19 6V74l-10-3-1-12H29Z"/></svg>`,
  git: `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 18v28m0 0L28 68m22-22 23 22" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="17" r="11" fill="currentColor"/><circle cx="28" cy="75" r="11" fill="currentColor"/><circle cx="73" cy="75" r="11" fill="currentColor"/></svg>`,
  github: `<svg viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M50 7c-24 0-43 19-43 43 0 19 12 35 29 41 2 .4 3-.8 3-2v-8c-12 3-15-5-15-5-2-5-5-6-5-6-4-3 .3-3 .3-3 4 .3 6 4 6 4 4 6 10 4 13 3 0-3 2-5 3-6-10-1-21-5-21-23 0-5 2-9 5-12-.5-2-2-7 .5-12 0 0 4-1 13 5a45 45 0 0 1 24 0c9-6 13-5 13-5 3 5 1 10 .5 12 3 3 5 7 5 12 0 18-11 22-21 23 2 2 3 4 3 8v13c0 1 1 2 3 2 17-6 29-22 29-41C93 26 74 7 50 7Z"/></svg>`,
  vercel: `<svg viewBox="0 0 100 86" aria-hidden="true"><path fill="currentColor" d="M50 0 100 86H0L50 0Z"/></svg>`,
  react: `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="50" r="6" fill="currentColor"/><ellipse cx="50" cy="50" rx="43" ry="17" stroke="currentColor" stroke-width="4"/><ellipse cx="50" cy="50" rx="43" ry="17" stroke="currentColor" stroke-width="4" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="43" ry="17" stroke="currentColor" stroke-width="4" transform="rotate(120 50 50)"/></svg>`,
  chatgpt: `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M50 15a19 19 0 0 1 32 13l-1 10 7 7a19 19 0 0 1-10 32l-10 2-5 9a19 19 0 0 1-35-4l-3-10-10-4a19 19 0 0 1-4-34l8-7v-11a19 19 0 0 1 31-13Z"/><path d="m33 30 34 20-1 37M22 39l35 20 24-14M28 78l1-37 24-14m-2 66-1-38-24-14m58 2L50 50"/></g></svg>`,
  gemini: `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="skills-gemini-gradient" x1="12" y1="90" x2="90" y2="9" gradientUnits="userSpaceOnUse"><stop stop-color="#34a853"/><stop offset=".36" stop-color="#4285f4"/><stop offset=".7" stop-color="#9b72cb"/><stop offset="1" stop-color="#ea4335"/></linearGradient></defs><path fill="url(#skills-gemini-gradient)" d="M50 0c7 25 13 37 50 50-37 13-43 25-50 50C43 75 37 63 0 50 37 37 43 25 50 0Z"/></svg>`,
  claude: `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M50 10v24M50 66v24M10 50h24m32 0h24M22 22l17 17m22 22 17 17m0-56L61 39M39 61 22 78"/><path d="m36 14 8 21m12 30 8 21M14 36l21 8m30 12 21 8m0-28-21 8M35 56l-21 8m50-50-8 21M44 65l-8 21"/></g></svg>`,
};

function getMark(skill) {
  if (skill.mark === "photoshop") return `<span class="skills-gallery__mark skills-gallery__mark--photoshop">Ps</span>`;
  if (skill.mark === "illustrator") return `<span class="skills-gallery__mark skills-gallery__mark--adobe">Ai</span>`;
  if (skill.mark === "scss") return `<span class="skills-gallery__mark skills-gallery__mark--scss">S</span>`;
  if (skill.mark === "javascript") return `<span class="skills-gallery__mark skills-gallery__mark--javascript">JS</span>`;
  if (skill.mark === "gsap") return `<span class="skills-gallery__mark skills-gallery__mark--gsap">GSAP</span>`;
  if (skill.mark === "scrolltrigger") return `<span class="skills-gallery__mark skills-gallery__mark--scrolltrigger">ST</span>`;
  if (skill.mark === "scrolla") return `<span class="skills-gallery__mark skills-gallery__mark--scrolla">S</span>`;
  if (skill.mark === "premiere") return `<span class="skills-gallery__mark skills-gallery__mark--premiere">Pr</span>`;
  if (skill.mark === "aftereffects") return `<span class="skills-gallery__mark skills-gallery__mark--aftereffects">Ae</span>`;
  if (skill.mark === "capcut") return `<span class="skills-gallery__mark skills-gallery__mark--capcut">X</span>`;
  if (skill.mark === "github") return `<span class="skills-gallery__mark skills-gallery__mark--github">${markMarkup.github}</span>`;
  if (skill.mark === "vercel") return `<span class="skills-gallery__mark skills-gallery__mark--vercel">${markMarkup.vercel}</span>`;
  if (skill.mark === "gemini") return `<span class="skills-gallery__mark skills-gallery__mark--gemini">${markMarkup.gemini}</span>`;
  if (skill.mark === "chatgpt") return `<span class="skills-gallery__mark skills-gallery__mark--chatgpt">${markMarkup.chatgpt}</span>`;
  if (skill.mark === "claude") return `<span class="skills-gallery__mark skills-gallery__mark--claude">${markMarkup.claude}</span>`;
  if (skill.mark === "git") return `<span class="skills-gallery__mark skills-gallery__mark--git">${markMarkup.git}</span>`;
  if (skill.mark === "figma") return `<span class="skills-gallery__mark skills-gallery__mark--figma">${markMarkup.figma}</span>`;
  if (skill.mark === "html") return `<span class="skills-gallery__mark skills-gallery__mark--html">${markMarkup.html}</span>`;
  if (skill.mark === "css") return `<span class="skills-gallery__mark skills-gallery__mark--css">${markMarkup.css}</span>`;
  if (skill.mark === "react") return `<span class="skills-gallery__mark skills-gallery__mark--react">${markMarkup.react}</span>`;
  return `<span class="skills-gallery__mark">${skill.name.slice(0, 2)}</span>`;
}

function createCard(skill, virtualIndex) {
  const card = document.createElement("div");
  card.className = `skills-gallery__card skills-gallery__card--${skill.mark}`;
  card.dataset.virtualIndex = String(virtualIndex);
  card.innerHTML = getMark(skill);
  return card;
}

export function initSkillsGallery() {
  const section = document.querySelector("[data-skills-gallery]");
  const cardTrack = section?.querySelector("[data-gallery-cards]");
  const categoryTrack = section?.querySelector("[data-gallery-category-track]");
  const skillTrack = section?.querySelector("[data-gallery-skill-track]");
  const announcement = section?.querySelector("[data-gallery-announcement]");
  if (!section || !cardTrack || !categoryTrack || !skillTrack || !announcement || skillItems.length === 0) return;

  const totalSkills = skillItems.length;
  const categoryItems = skillGroups.map(({ section }) => section);
  categoryItems.forEach((name) => {
    const row = document.createElement("span");
    row.className = "skills-gallery__category";
    row.textContent = name;
    categoryTrack.append(row);
  });
  skillItems.forEach(({ name }) => {
    const row = document.createElement("span");
    row.className = "skills-gallery__skill";
    row.textContent = name;
    skillTrack.append(row);
  });

  const virtualCards = Array.from({ length: totalSkills * 3 }, (_, index) => {
    const item = skillItems[index % totalSkills];
    const card = createCard(item, index);
    cardTrack.append(card);
    return card;
  });

  let activeIndex = 0;
  let skillTween;
  let categoryTween;
  const motionState = { progress: 0 };

  function setActiveSkill(index) {
    const nextIndex = Math.max(0, Math.min(totalSkills - 1, index));
    if (nextIndex === activeIndex) return;
    const previousItem = skillItems[activeIndex];
    const item = skillItems[nextIndex];
    const sectionChanged = previousItem.section !== item.section;
    activeIndex = nextIndex;

    skillTween?.kill();
    skillTween = gsap.to(skillTrack, {
      yPercent: -(nextIndex / totalSkills) * 100,
      duration: 0.3,
      ease: "power1.out",
      overwrite: true,
    });
    announcement.textContent = `${item.section}: ${item.name}`;

    if (sectionChanged) {
      categoryTween?.kill();
      const categoryIndex = categoryItems.indexOf(item.section);
      categoryTween = gsap.to(categoryTrack, {
        yPercent: -(categoryIndex / categoryItems.length) * 100,
        duration: 0.3,
        ease: "power1.out",
        overwrite: true,
      });
    }
  }

  function positionCards(progress = 0) {
    const slotAngle = 21.78 * (Math.PI / 180);
    const activeStep = totalSkills + progress * (totalSkills - 1);
    const radius = window.innerWidth < 900
      ? Math.max(window.innerWidth * 0.86, window.innerHeight * 1.1)
      : window.innerWidth * 0.86;

    virtualCards.forEach((card) => {
      const virtualIndex = Number(card.dataset.virtualIndex);
      const offset = virtualIndex - activeStep;
      const angle = Math.PI / 2 - offset * slotAngle;
      const distance = Math.abs(offset);
      const opacity = Math.max(0, 1 - distance / 7.5);
      const x = Math.cos(angle) * radius;
      const y = radius - Math.sin(angle) * radius;
      const rotation = -(angle - Math.PI / 2) * (180 / Math.PI);

      gsap.set(card, {
        x,
        y,
        rotation,
        opacity,
        scale: 1,
        zIndex: Math.round(1000 - distance * 10),
        transformOrigin: "center center",
      });
    });

    setActiveSkill(Math.round(progress * (totalSkills - 1)));
  }

  positionCards(0);

  const motionTween = gsap.to(motionState, {
    progress: 1,
    ease: "none",
    onUpdate: () => positionCards(motionState.progress),
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${window.innerHeight * 7}`,
      pin: section,
      pinSpacing: true,
      scrub: 0.35,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: (self) => positionCards(self.progress),
      onLeave: () => positionCards(1),
      onEnterBack: (self) => positionCards(self.progress),
      onLeaveBack: () => positionCards(0),
    },
  });
  const scrollTrigger = motionTween.scrollTrigger;

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return () => {
    scrollTrigger.kill();
    motionTween.kill();
    skillTween?.kill();
    categoryTween?.kill();
    gsap.killTweensOf([categoryTrack, skillTrack, ...virtualCards]);
    gsap.set([...virtualCards, categoryTrack, skillTrack], { clearProps: "all" });
    cardTrack.replaceChildren();
  };
}
