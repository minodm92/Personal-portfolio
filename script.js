import {
  initAbout,
  initAboutVisual,
  initApproach,
  initCaseStudy,
  initCloneCoding,
  initContact,
  initHeader,
  initHero,
  initHorizontalStory,
  initIntro,
  initPortfolioBot,
  initQuickQa,
  initPersonalStory,
  initPostProcessToc,
  initProcessMarket,
  initSkills,
  initSkillsGallery,
  initTeamOverview,
  initThirdToc,
  initWork,
  initWorkTypes,
} from "./assets/components/index.js";
import { initScrollSpeed } from "./assets/common/scroll-speed.js";

document.documentElement.classList.add("js");
initScrollSpeed();

// Motion reduction is intentionally disabled for this portfolio experience.
const reduceMotion = { matches: false };
initHeader();
initHero({ reduceMotion });
initIntro({ reduceMotion });
initTeamOverview();
await initHorizontalStory();
initProcessMarket();
await initPostProcessToc();
initPersonalStory();
await initThirdToc();
initCloneCoding();
initWork({ reduceMotion });
initWorkTypes({ reduceMotion });
initCaseStudy({ reduceMotion });
initApproach({ reduceMotion });
initSkills({ reduceMotion });
initAbout({ reduceMotion });
initContact({ reduceMotion });
initPortfolioBot({ reduceMotion });
initSkillsGallery();
initAboutVisual();
initQuickQa();
