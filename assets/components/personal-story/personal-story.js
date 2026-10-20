export function initPersonalStory() {
  document.querySelectorAll("[data-personal-enter]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") event.preventDefault();
    });
  });
}
