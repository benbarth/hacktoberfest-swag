const focusableSelector =
  'a[href], area[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function setupSkipLinks() {
  const skipLinks = document.querySelectorAll(".skip-link");

  if (!skipLinks.length) {
    return;
  }

  skipLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || !targetId.startsWith("#")) {
        return;
      }

      const target = document.querySelector(targetId);

      if (target instanceof HTMLElement) {
        event.preventDefault();
        target.focus({ preventScroll: false });
      }
    });
  });
}

function setupActiveNavLink() {
  const { page } = document.body.dataset;

  if (!page) {
    return;
  }

  document
    .querySelectorAll(".site-header__link[data-page-target]")
    .forEach((link) => {
      const target = link.dataset.pageTarget
        ?.split(",")
        .map((value) => value.trim());

      if (target?.includes(page)) {
        link.classList.add("site-header__link--active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("site-header__link--active");
        link.removeAttribute("aria-current");
      }
    });
}

function setupMobileNav() {
  const header = document.querySelector(".site-header");

  if (!header) {
    return;
  }

  const toggle = header.querySelector("[data-nav-toggle]");
  const nav = header.querySelector("[data-nav]");
  const mobileQuery = window.matchMedia("(max-width: 900px)");

  if (!toggle || !nav) {
    return;
  }

  let isOpen = false;
  let previousFocus = null;

  function updateAriaHidden(forceHidden) {
    if (!mobileQuery.matches) {
      nav.removeAttribute("aria-hidden");
      return;
    }

    if (forceHidden) {
      nav.setAttribute("aria-hidden", "true");
    } else {
      nav.setAttribute("aria-hidden", "false");
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      closeNav();
    }
  }

  function onClickOutside(event) {
    if (!header.contains(event.target)) {
      closeNav();
    }
  }

  function openNav() {
    if (isOpen || !mobileQuery.matches) {
      return;
    }

    isOpen = true;
    header.classList.add("site-header--nav-open");
    toggle.setAttribute("aria-expanded", "true");
    updateAriaHidden(false);
    document.body.classList.add("has-mobile-nav");
    previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onClickOutside, true);

    const firstNavItem = nav.querySelector("a, button");
    window.requestAnimationFrame(() => {
      firstNavItem?.focus();
    });
  }

  function closeNav(options = {}) {
    const { returnFocus = true } = options;

    if (!isOpen) {
      updateAriaHidden(true);
      return;
    }

    isOpen = false;
    header.classList.remove("site-header--nav-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("has-mobile-nav");
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onClickOutside, true);
    updateAriaHidden(true);

    if (returnFocus) {
      const focusTarget =
        previousFocus instanceof HTMLElement ? previousFocus : toggle;
      window.requestAnimationFrame(() => {
        focusTarget?.focus();
      });
    }
  }

  toggle.addEventListener("click", () => {
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  nav.querySelectorAll("a, button").forEach((node) => {
    node.addEventListener("click", () => {
      closeNav({ returnFocus: false });
    });
  });

  function handleChange() {
    if (!mobileQuery.matches) {
      closeNav({ returnFocus: false });
      toggle.setAttribute("aria-expanded", "false");
      nav.removeAttribute("aria-hidden");
    } else if (!isOpen) {
      updateAriaHidden(true);
    }
  }

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleChange);
  }

  if (mobileQuery.matches) {
    updateAriaHidden(true);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function highlightYamlBlocks() {
  const blocks = document.querySelectorAll(
    "code.language-yaml, code.language-yml",
  );

  blocks.forEach((block) => {
    if (block.dataset.highlighted === "true") {
      return;
    }

    const source = block.textContent;

    if (!source) {
      return;
    }

    let html = escapeHtml(source);

    html = html.replace(/(^|\n)(\s*#.*)/g, (fullMatch, lineStart, comment) => {
      return `${lineStart}<span class="token comment">${comment}</span>`;
    });

    html = html.replace(
      /(^|\n)(\s*)([A-Za-z][\w\s-]*)(?=\s*:)/g,
      (fullMatch, lineStart, indent, key) => {
        return `${lineStart}${indent}<span class="token key">${key}</span>`;
      },
    );

    html = html.replace(
      /(:\s*)(https?:\/\/[^\s<]+)/g,
      (fullMatch, prefix, url) => {
        return `${prefix}<span class="token url">${url}</span>`;
      },
    );

    html = html.replace(
      /(:\s*)(True|False)/g,
      (fullMatch, prefix, booleanValue) => {
        return `${prefix}<span class="token boolean">${booleanValue}</span>`;
      },
    );

    block.innerHTML = html;
    block.dataset.highlighted = "true";
  });
}

function setupIssueOverlay() {
  const overlay = document.querySelector("[data-issue-overlay]");

  if (!overlay) {
    return;
  }

  const backdrop = overlay.querySelector(".issue-overlay__backdrop");
  const closeButtons = overlay.querySelectorAll(
    "[data-issue-close]:not(.issue-overlay__backdrop)",
  );
  const triggers = document.querySelectorAll("[data-issue-trigger]");
  const issueLinks = overlay.querySelectorAll(".issue-overlay__link");
  let previousFocus = null;

  function trapFocus(event) {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = overlay.querySelectorAll(focusableSelector);

    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      closeOverlay();
      return;
    }

    trapFocus(event);
  }

  function openOverlay() {
    if (overlay.classList.contains("is-open")) {
      return;
    }

    previousFocus = document.activeElement;
    overlay.classList.add("is-open");
    overlay.removeAttribute("hidden");
    document.body.classList.add("has-issue-overlay");

    const firstLink = overlay.querySelector("[data-issue-link]");
    window.requestAnimationFrame(() => {
      firstLink?.focus();
    });

    document.addEventListener("keydown", onKeydown);
  }

  function closeOverlay() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("hidden", "");
    document.body.classList.remove("has-issue-overlay");
    document.removeEventListener("keydown", onKeydown);

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openOverlay();
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeOverlay();
    });
  });

  backdrop?.addEventListener("click", () => {
    closeOverlay();
  });

  issueLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeOverlay();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.remove("no-js");
  document.body.classList.add("has-js");
  setupSkipLinks();
  setupActiveNavLink();
  setupMobileNav();
  highlightYamlBlocks();
  setupIssueOverlay();
});
