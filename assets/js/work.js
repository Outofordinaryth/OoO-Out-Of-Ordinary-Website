/* 06 — Brand Showcase: category filter for the project grid */
(() => {
  const grid = document.querySelector("[data-work-grid]");
  const chips = [...document.querySelectorAll("[data-filter]")];
  if (!grid || !chips.length) return;
  const cards = [...grid.querySelectorAll("[data-category]")];
  const empty = document.querySelector("[data-work-empty]");

  const apply = (filter) => {
    chips.forEach((chip) => {
      const on = chip.dataset.filter === filter;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", String(on));
    });
    grid.classList.toggle("is-filtered", filter !== "all");
    let shown = 0;
    cards.forEach((card) => {
      const match = filter === "all" || card.dataset.category.split(/\s+/).includes(filter);
      card.hidden = !match;
      card.classList.remove("is-entering");
      if (match) {
        card.classList.add("is-in");
        void card.offsetWidth; // restart the entrance animation
        card.style.setProperty("--stagger", `${shown * 0.08}s`);
        card.classList.add("is-entering");
        shown++;
      }
    });
    if (empty) empty.hidden = shown > 0;
  };

  chips.forEach((chip) => chip.addEventListener("click", () => apply(chip.dataset.filter)));
})();
