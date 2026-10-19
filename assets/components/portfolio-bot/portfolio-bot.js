export function initPortfolioBot({ reduceMotion }) {
  const bot = document.querySelector("[data-bot]");
  const botToggle = bot?.querySelector(".portfolio-bot__toggle");
  const botPanel = bot?.querySelector(".portfolio-bot__panel");
  const botAnswer = bot?.querySelector("[data-bot-answer]");

  const setBot = (open) => {
    if (!botToggle || !botPanel) return;
    botToggle.setAttribute("aria-expanded", String(open));
    botPanel.hidden = !open;
  };

  botToggle?.addEventListener("click", () => setBot(botToggle.getAttribute("aria-expanded") !== "true"));
  bot?.querySelector("[data-bot-close]")?.addEventListener("click", () => {
    setBot(false);
    botToggle?.focus();
  });
  bot?.querySelectorAll("[data-target]").forEach((choice) => {
    choice.addEventListener("click", () => {
      if (botAnswer) botAnswer.textContent = choice.dataset.answer || "해당 섹션으로 이동합니다.";
      document.getElementById(choice.dataset.target)?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  });
}
