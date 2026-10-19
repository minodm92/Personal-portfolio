export function initMagneticWithin(container, reduceMotion) {
  if (!container || reduceMotion.matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  container.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      button.style.setProperty("--mag-x", `${(event.clientX - rect.left - rect.width / 2) * 0.12}px`);
      button.style.setProperty("--mag-y", `${(event.clientY - rect.top - rect.height / 2) * 0.16}px`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--mag-x", "0px");
      button.style.setProperty("--mag-y", "0px");
    });
  });
}
