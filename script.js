import {
  initAbout,
  initApproach,
  initCaseStudy,
  initContact,
  initHeader,
  initHero,
  initHorizontalStory,
  initIntro,
  initPortfolioBot,
  initSkills,
  initTeamOverview,
  initWork,
  initWorkTypes,
} from "./assets/components/index.js";

document.documentElement.classList.add("js");

// Motion reduction is intentionally disabled for this portfolio experience.
const reduceMotion = { matches: false };
initHeader();
initHero({ reduceMotion });
initIntro({ reduceMotion });
initTeamOverview();
initHorizontalStory();
initWork({ reduceMotion });
initWorkTypes({ reduceMotion });
initCaseStudy({ reduceMotion });
initApproach({ reduceMotion });
initSkills({ reduceMotion });
initAbout({ reduceMotion });
initContact({ reduceMotion });
initPortfolioBot({ reduceMotion });
