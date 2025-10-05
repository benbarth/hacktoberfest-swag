/**
 * @typedef {"sponsor" | "verified" | "unverified"} ParticipantStatus
 * @typedef {Object} Participant
 * @property {string} name
 * @property {string} description
 * @property {string} year
 * @property {ParticipantStatus} status
 * @property {string[]} [swag]
 * @property {string} [website]
 * @property {string} [detailsUrl]
 */

const statusLabels = {
  sponsor: "Sponsor",
  verified: "Verified",
  unverified: "Unverified",
};

const statusDescriptions = {
  sponsor: "Official Hacktoberfest partners and sponsors",
  verified: "Opportunities verified for the current year",
  unverified: "Listings from the previous season awaiting confirmation",
};

const state = {
  query: "",
  statuses: new Set(),
  swag: new Set(),
  sort: "recommended",
};

const selectors = {
  searchInput: document.querySelector("#searchInput"),
  resetFilters: document.querySelector("#resetFilters"),
  sortSelect: document.querySelector("#sortSelect"),
  statusFilters: document.querySelector("#statusFilters"),
  swagFilters: document.querySelector("#swagFilters"),
  resultsGrid: document.querySelector("#resultsGrid"),
  resultsCount: document.querySelector("#resultsCount"),
  activeFilters: document.querySelector("#activeFilters"),
  emptyState: document.querySelector("#emptyState"),
};

/** @type {Participant[]} */
let participants = [];
/** @type {Set<ParticipantStatus>} */
let allStatuses = new Set();
/** @type {Set<string>} */
let allSwag = new Set();

async function init() {
  bindControls();
  const loaded = await loadParticipants();

  if (loaded) {
    render();
  }
}

function bindControls() {
  selectors.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    render();
  });

  selectors.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  selectors.resetFilters.addEventListener("click", () => {
    state.query = "";
    state.sort = "recommended";
    state.swag.clear();
    state.statuses = new Set(allStatuses);
    selectors.searchInput.value = "";
    selectors.sortSelect.value = "recommended";
    updateFilterButtons();
    render();
  });
}

async function loadParticipants() {
  try {
    const response = await fetch("assets/data/participants.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Failed to load participants: ${response.status}`);
      selectors.resultsCount.textContent =
        "We couldn’t load the opportunities right now.";
      selectors.emptyState.hidden = false;
      return false;
    }

    const data = await response.json();
    participants = Array.isArray(data) ? data : [];

    allStatuses = new Set(
      participants.map((item) => item.status).filter(Boolean),
    );
    state.statuses = new Set(allStatuses);

    allSwag = new Set(
      participants
        .flatMap((item) => (Array.isArray(item.swag) ? item.swag : []))
        .map((value) => (typeof value === "string" ? value.trim() : value))
        .filter((value) => typeof value === "string" && value.length > 0),
    );

    buildFilterGroup(
      selectors.statusFilters,
      Array.from(allStatuses),
      "status",
    );
    buildFilterGroup(selectors.swagFilters, Array.from(allSwag).sort(), "swag");
    updateFilterButtons();
    return true;
  } catch (error) {
    console.error(error);
    selectors.resultsCount.textContent =
      "We couldn’t load the opportunities right now.";
    selectors.emptyState.hidden = false;
    return false;
  }
}

function buildFilterGroup(container, values, group) {
  container.innerHTML = "";

  if (!values.length) {
    return;
  }

  values
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-chip";
      button.dataset.value = value;
      button.dataset.group = group;
      const isActive =
        group === "status" ? state.statuses.has(value) : state.swag.has(value);
      button.setAttribute("aria-pressed", String(isActive));
      button.textContent =
        group === "status"
          ? (statusLabels[value] ?? value)
          : formatSwagLabel(value);

      if (group === "status") {
        button.title = statusDescriptions[value] ?? "";
      }

      button.addEventListener("click", () =>
        toggleFilter(value, group, button),
      );

      container.appendChild(button);
    });
}

function toggleFilter(value, group, button) {
  if (group === "status") {
    const isActive = state.statuses.has(value);

    if (isActive && state.statuses.size === 1) {
      return; // always keep at least one status active
    }

    if (isActive) {
      state.statuses.delete(value);
    } else {
      state.statuses.add(value);
    }

    button.setAttribute("aria-pressed", String(!isActive));
  } else if (group === "swag") {
    const isActive = state.swag.has(value);

    if (isActive) {
      state.swag.delete(value);
    } else {
      state.swag.add(value);
    }

    button.setAttribute("aria-pressed", String(!isActive));
  }

  render();
  updateFilterButtons();
}

function updateFilterButtons() {
  selectors.statusFilters.querySelectorAll(".filter-chip").forEach((button) => {
    const value = button.dataset.value;
    button.setAttribute("aria-pressed", String(state.statuses.has(value)));
  });

  selectors.swagFilters.querySelectorAll(".filter-chip").forEach((button) => {
    const value = button.dataset.value;
    button.setAttribute("aria-pressed", String(state.swag.has(value)));
  });
}

function render() {
  const filtered = applyFilters();
  const sorted = sortResults(filtered);

  renderMeta(sorted.length);
  renderCards(sorted);
  renderActiveFilters();
}

function applyFilters() {
  const query = state.query.toLowerCase();

  return participants.filter((item) => {
    const statusMatch = state.statuses.has(item.status);

    if (!statusMatch) {
      return false;
    }

    if (state.swag.size > 0) {
      const hasAllSwag = Array.from(state.swag).every((selected) =>
        (item.swag ?? []).includes(selected),
      );

      if (!hasAllSwag) {
        return false;
      }
    }

    if (!query) {
      return true;
    }

    const haystack = [
      item.name,
      item.description,
      item.year,
      statusLabels[item.status],
      ...(item.swag ?? []).map((swag) => formatSwagLabel(swag)),
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    return haystack.some((value) => value.includes(query));
  });
}

function sortResults(items) {
  const statusPriority = {
    sponsor: 0,
    verified: 1,
    unverified: 2,
  };

  const sorters = {
    recommended: (a, b) => {
      const statusDiff =
        (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      const swagDiff = (b.swag?.length ?? 0) - (a.swag?.length ?? 0);

      if (swagDiff !== 0) {
        return swagDiff;
      }

      return a.name.localeCompare(b.name);
    },
    "name-asc": (a, b) => a.name.localeCompare(b.name),
    "name-desc": (a, b) => b.name.localeCompare(a.name),
    "swag-desc": (a, b) =>
      (b.swag?.length ?? 0) - (a.swag?.length ?? 0) ||
      a.name.localeCompare(b.name),
    "year-desc": (a, b) =>
      Number(b.year) - Number(a.year) ||
      (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99),
  };

  const sorter = sorters[state.sort] ?? sorters.recommended;

  return [...items].sort(sorter);
}

function renderMeta(count) {
  selectors.resultsCount.textContent =
    count === 1 ? "1 opportunity" : `${count} opportunities`;
  selectors.emptyState.hidden = count !== 0;
}

function renderCards(items) {
  const activeElement = document.activeElement;
  let restoreFocus = null;

  if (activeElement && selectors.resultsGrid.contains(activeElement)) {
    const activeCard = activeElement.closest("[data-participant-id]");
    restoreFocus = {
      id: activeCard?.dataset.participantId ?? null,
      href:
        activeElement instanceof HTMLAnchorElement
          ? activeElement.getAttribute("href")
          : null,
    };
  }

  selectors.resultsGrid.innerHTML = "";

  if (!items.length) {
    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        selectors.emptyState.focus();
      });
    }

    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("role", "listitem");
    const participantId = createParticipantId(item, index);
    card.dataset.participantId = participantId;
    card.tabIndex = -1;

    const header = document.createElement("div");
    header.className = "card__header";

    const statusBadge = document.createElement("span");
    statusBadge.className = `card__status card__status--${item.status}`;
    statusBadge.textContent = `${statusLabels[item.status] ?? item.status} • ${item.year}`;
    statusBadge.title = statusDescriptions[item.status] ?? "";
    header.appendChild(statusBadge);

    const title = document.createElement("h2");
    title.className = "card__title";
    const titleId = `${participantId}-title`;
    title.id = titleId;
    title.textContent = item.name;
    header.appendChild(title);
    card.setAttribute("aria-labelledby", titleId);

    const description = document.createElement("p");
    description.className = "card__description";
    description.textContent = item.description;

    const swagList = document.createElement("div");
    swagList.className = "card__swag";

    if (item.swag?.length) {
      item.swag.forEach((swag) => {
        const icon = document.createElement("img");
        icon.src = `icons/${swag}.png`;
        icon.alt = `${formatSwagLabel(swag)} icon`;
        icon.loading = "lazy";
        swagList.appendChild(icon);
      });
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "results__chip";
      placeholder.textContent = "Reward details coming soon";
      swagList.appendChild(placeholder);
    }

    const footer = document.createElement("div");
    footer.className = "card__footer";

    const links = document.createElement("div");
    links.className = "card__links";

    if (item.website) {
      const websiteLink = createLink(item.website, "Visit website");
      links.appendChild(websiteLink);
    }

    if (item.detailsUrl && item.detailsUrl !== item.website) {
      const detailsLink = createLink(item.detailsUrl, "Read full details");
      links.appendChild(detailsLink);
    }

    footer.appendChild(links);

    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(swagList);
    card.appendChild(footer);

    selectors.resultsGrid.appendChild(card);
  });

  if (restoreFocus?.id) {
    const cardToFocus = selectors.resultsGrid.querySelector(
      `[data-participant-id="${restoreFocus?.id}"]`,
    );

    if (cardToFocus) {
      let focusTarget = null;

      if (restoreFocus?.href) {
        focusTarget = cardToFocus.querySelector(
          `a[href="${restoreFocus?.href}"]`,
        );
      }

      window.requestAnimationFrame(() => {
        (focusTarget ?? cardToFocus).focus();
      });
    }
  }
}

function createLink(href, label) {
  const anchor = document.createElement("a");
  anchor.className = "card__link";
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noreferrer";
  anchor.textContent = label;
  return anchor;
}

function renderActiveFilters() {
  selectors.activeFilters.innerHTML = "";

  if (state.query) {
    selectors.activeFilters.appendChild(createChip(`Search: ${state.query}`));
  }

  const activeStatusCount = state.statuses.size;
  if (activeStatusCount > 0 && activeStatusCount < allStatuses.size) {
    Array.from(state.statuses)
      .sort((a, b) => a.localeCompare(b))
      .forEach((status) => {
        selectors.activeFilters.appendChild(
          createChip(statusLabels[status] ?? status),
        );
      });
  }

  if (state.swag.size > 0) {
    Array.from(state.swag)
      .sort((a, b) => a.localeCompare(b))
      .forEach((swag) => {
        selectors.activeFilters.appendChild(createChip(formatSwagLabel(swag)));
      });
  }
}

function createChip(label) {
  const chip = document.createElement("span");
  chip.className = "results__chip";
  chip.textContent = label;
  return chip;
}

function formatSwagLabel(value) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function createParticipantId(participant, index) {
  const base =
    participant.name ||
    participant.detailsUrl ||
    participant.website ||
    `participant-${index}`;

  const slug = base
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || `participant-${index}`;
}

document.addEventListener("DOMContentLoaded", init);
