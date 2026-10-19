export function initTeamOverview() {
  const section = document.querySelector("[data-team-overview]");
  if (!section) return;

  if (!("IntersectionObserver" in window)) {
    section.classList.add("is-active");
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => section.classList.toggle("is-active", entry.isIntersecting),
    { threshold: .35 },
  );
  observer.observe(section);
}
