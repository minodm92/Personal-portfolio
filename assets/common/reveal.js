export function initRevealWithin(container, reduceMotion) {
  if (!container) return;

  const items = container.querySelectorAll("[data-reveal]");
  items.forEach((item, index) => item.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`));

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -5%" });

  items.forEach((item) => observer.observe(item));
}
