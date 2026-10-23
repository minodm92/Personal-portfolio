export function initHeader() {
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#site-nav");

  const setMenu = (open) => {
    menuButton?.setAttribute("aria-expanded", String(open));
    navigation?.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) navigation?.querySelector("a")?.focus();
  };

  menuButton?.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });
  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || menuButton?.getAttribute("aria-expanded") !== "true") return;
    setMenu(false);
    menuButton.focus();
  });

  let lastScrollY = window.scrollY;
  let ticking = false;
  const updateHeader = () => {
    const scrollY = window.scrollY;
    header?.classList.toggle("is-scrolled", scrollY > 24);
    header?.classList.toggle("is-hidden", scrollY > lastScrollY && scrollY > 160 && !navigation?.classList.contains("is-open"));
    lastScrollY = scrollY;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();
}
