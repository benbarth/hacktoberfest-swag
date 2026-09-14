const root = document.documentElement;
const navToggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
const navLabel = document.querySelector<HTMLElement>("[data-nav-label]");
const navIcon = document.querySelector<HTMLElement>("[data-nav-icon]");
const nav = document.querySelector<HTMLElement>("[data-nav]");
const themeToggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
const themes = ["auto", "light", "dark"] as const;
const background = [...document.querySelectorAll<HTMLElement>("body > main, body > footer, .brand, .skip-link")];

function setNavigation(open: boolean) {
  navToggle?.setAttribute("aria-expanded", "false");
  if (open) navToggle?.setAttribute("aria-expanded", "true");
  if (navLabel) navLabel.textContent = open ? "Close navigation" : "Open navigation";
  navIcon?.classList.toggle("ph-list", !open);
  navIcon?.classList.toggle("ph-x", open);
  nav?.toggleAttribute("data-open", open);
  root.toggleAttribute("data-nav-open", open);
  background.forEach((element) => {
    element.inert = open;
  });
}

function closeNavigation() {
  setNavigation(false);
}

navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") === "true";
  setNavigation(!open);
});

nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav?.hasAttribute("data-open")) {
    closeNavigation();
    navToggle?.focus();
  }
});

window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
  if (event.matches) closeNavigation();
});

themeToggle?.addEventListener("click", () => {
  const current = themes.indexOf((root.dataset.theme as (typeof themes)[number]) || "auto");
  const next = themes[(current + 1) % themes.length];
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
  themeToggle.setAttribute("aria-label", `Color theme: ${next}. Activate to change.`);
});
