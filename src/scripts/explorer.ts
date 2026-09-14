const explorer = document.querySelector<HTMLElement>("[data-explorer]");

if (explorer) {
  const search = explorer.querySelector<HTMLInputElement>("[data-search]");
  const sort = explorer.querySelector<HTMLSelectElement>("[data-sort]");
  const cards = [...explorer.querySelectorAll<HTMLElement>("[data-opportunity]")];
  const results = explorer.querySelector<HTMLElement>("[data-results]");
  const count = explorer.querySelector<HTMLElement>("[data-results-count]");
  const empty = explorer.querySelector<HTMLElement>("[data-empty]");
  const clear = explorer.querySelector<HTMLButtonElement>("[data-clear]");
  const emptyClear = explorer.querySelector<HTMLButtonElement>("[data-empty-clear]");
  const filterButtons = [...explorer.querySelectorAll<HTMLButtonElement>("[data-filter]")];
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  const active = { reward: new Set<string>() };

  function update() {
    const query = search?.value.trim().toLocaleLowerCase() ?? "";
    const visible = cards.filter((card) => {
      const rewards = new Set((card.dataset.rewards ?? "").split(",").filter(Boolean));
      const rewardMatch = active.reward.size === 0 || [...active.reward].some((item) => rewards.has(item));
      const queryMatch = !query || (card.dataset.search ?? "").includes(query);
      const show = rewardMatch && queryMatch;
      card.hidden = !show;
      return show;
    });

    const mode = sort?.value ?? "name";
    visible.sort((left, right) => {
      if (mode === "name") return collator.compare(left.dataset.name ?? "", right.dataset.name ?? "");
      if (mode === "rewards") {
        const difference = (right.dataset.rewards?.split(",").length ?? 0) - (left.dataset.rewards?.split(",").length ?? 0);
        if (difference) return difference;
      }
      return collator.compare(left.dataset.name ?? "", right.dataset.name ?? "");
    });
    visible.forEach((card) => results?.append(card));

    if (count) count.textContent = `${visible.length} ${visible.length === 1 ? "listing" : "listings"}`;
    if (empty) empty.hidden = visible.length !== 0;
    const filtered = Boolean(query || active.reward.size || mode !== "name");
    if (clear) clear.hidden = !filtered;
  }

  function reset() {
    if (search) search.value = "";
    if (sort) sort.value = "name";
    active.reward.clear();
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
    update();
    search?.focus();
  }

  search?.addEventListener("input", update);
  sort?.addEventListener("change", update);
  clear?.addEventListener("click", reset);
  emptyClear?.addEventListener("click", reset);
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.value ?? "";
      const enabled = button.getAttribute("aria-pressed") === "true";
      if (enabled) active.reward.delete(value);
      else active.reward.add(value);
      button.setAttribute("aria-pressed", String(!enabled));
      update();
    });
  });

  update();
}
