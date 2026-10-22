export function initPersonalStory() {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  document.querySelectorAll("[data-personal-enter-panel]").forEach((panel) => {
    const title = panel.querySelector(".personal-wire__title");
    const enterCursor = panel.querySelector("[data-personal-enter-cursor]");
    const enterUrl = panel.dataset.personalEnterUrl;
    if (!title || !enterCursor) return;

    const isEnterZone = (event) => {
      const panelRect = panel.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      return event.clientX >= titleRect.left
        && event.clientX <= panelRect.right
        && event.clientY >= panelRect.top
        && event.clientY <= panelRect.bottom;
    };

    const resetEnterCursor = () => panel.classList.remove("is-enter-zone");

    panel.addEventListener("pointermove", (event) => {
      if (!finePointer.matches || !isEnterZone(event)) {
        resetEnterCursor();
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      panel.classList.add("is-enter-zone");
      enterCursor.style.left = `${event.clientX - panelRect.left}px`;
      enterCursor.style.top = `${event.clientY - panelRect.top}px`;
    });
    panel.addEventListener("pointerleave", resetEnterCursor);
    panel.addEventListener("click", (event) => {
      if (!enterUrl || enterUrl === "#" || !isEnterZone(event)) return;
      window.open(enterUrl, "_blank", "noopener,noreferrer");
    });
  });
}
