export function initPersonalStory() {
  document.querySelectorAll("[data-personal-enter]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") event.preventDefault();
    });
  });

  const ikeaPanel = document.querySelector(".personal-wire--ikea");
  const ikeaTitle = ikeaPanel?.querySelector(".personal-wire__title");
  const ikeaUrl = ikeaPanel?.dataset.personalEnterUrl;
  const enterCursor = ikeaPanel?.querySelector("[data-personal-enter-cursor]");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!ikeaPanel || !ikeaTitle || !ikeaUrl || !enterCursor) return;

  const isEnterZone = (event) => {
    const panelRect = ikeaPanel.getBoundingClientRect();
    const titleRect = ikeaTitle.getBoundingClientRect();
    return event.clientX >= titleRect.left
      && event.clientX <= panelRect.right
      && event.clientY >= panelRect.top
      && event.clientY <= panelRect.bottom;
  };

  const resetEnterCursor = () => ikeaPanel.classList.remove("is-enter-zone");

  ikeaPanel.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || !isEnterZone(event)) {
      resetEnterCursor();
      return;
    }

    const panelRect = ikeaPanel.getBoundingClientRect();
    ikeaPanel.classList.add("is-enter-zone");
    enterCursor.style.left = `${event.clientX - panelRect.left}px`;
    enterCursor.style.top = `${event.clientY - panelRect.top}px`;
  });
  ikeaPanel.addEventListener("pointerleave", resetEnterCursor);
  ikeaPanel.addEventListener("click", (event) => {
    if (!isEnterZone(event)) return;
    window.open(ikeaUrl, "_blank", "noopener,noreferrer");
  });
}
