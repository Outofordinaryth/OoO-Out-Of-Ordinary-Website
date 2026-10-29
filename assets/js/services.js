/* 02 — Services · package card stack
   Hover fans the tickets out; clicking a back ticket (or a name below) brings it
   to the front; clicking the front ticket opens its package page.
   While in view and untouched, the stack slowly cycles on its own. */
(() => {
  const stack = document.querySelector("[data-stack]");
  if (!stack) return;
  const cards = [...stack.querySelectorAll(".pcard")];
  const tabs = [...document.querySelectorAll("[data-stack-to]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // front-first order of card indices (matches the initial data-pos markup)
  let order = cards.map((_, i) => i).sort((a, b) => cards[a].dataset.pos - cards[b].dataset.pos);

  const render = () => {
    order.forEach((cardIndex, pos) => {
      const card = cards[cardIndex];
      card.dataset.pos = pos;
      card.tabIndex = pos === 0 ? 0 : -1;
    });
    tabs.forEach((t) => {
      const on = Number(t.dataset.stackTo) === order[0];
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
  };
  const bringToFront = (i) => { order = [i, ...order.filter((x) => x !== i)]; render(); };
  const cycle = (dir = 1) => {
    if (dir > 0) order.push(order.shift()); else order.unshift(order.pop());
    render();
  };

  // ---- auto-cycle (stops for good once the visitor interacts) ----
  let timer = null, touched = false, inView = false, paused = false;
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => {
    if (reduceMotion || touched || timer || !inView) return;
    timer = setInterval(() => { if (!paused) cycle(1); }, 3800);
  };
  const userAct = () => { touched = true; stop(); };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      inView ? setTimeout(start, 2200) : stop();
    }, { threshold: 0.5 }).observe(stack);
  }
  stack.addEventListener("pointerenter", () => (paused = true));
  stack.addEventListener("pointerleave", () => (paused = false));
  stack.addEventListener("focusin", () => (paused = true));
  stack.addEventListener("focusout", () => (paused = false));

  // ---- interaction ----
  cards.forEach((card, i) =>
    card.addEventListener("click", (e) => {
      if (Number(card.dataset.pos) !== 0) { e.preventDefault(); userAct(); bringToFront(i); }
    })
  );
  tabs.forEach((t) => t.addEventListener("click", () => { userAct(); bringToFront(Number(t.dataset.stackTo)); }));
  stack.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault(); userAct(); cycle(e.key === "ArrowRight" ? 1 : -1);
      cards[order[0]].focus({ preventScroll: true });
    }
  });

  // swipe (touch) cycles the deck
  let sx = null, swiped = false;
  stack.addEventListener("pointerdown", (e) => { sx = e.clientX; swiped = false; });
  stack.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) { swiped = true; userAct(); cycle(dx < 0 ? 1 : -1); }
  });
  stack.addEventListener("click", (e) => { if (swiped) { e.preventDefault(); e.stopPropagation(); swiped = false; } }, true);

  render();
})();
