/* About — brand value cards can be picked up and moved around (desktop only). */
(() => {
  const stage = document.querySelector(".vstage");
  if (!stage) return;
  const desktop = window.matchMedia("(min-width: 981px)");
  let top = 10;

  stage.querySelectorAll(".vcard").forEach((card) => {
    let start = null;
    card.addEventListener("pointerdown", (e) => {
      if (!desktop.matches || e.button !== 0) return;
      const left = parseFloat(getComputedStyle(card).left);
      const topPx = parseFloat(getComputedStyle(card).top);
      start = { x: e.clientX, y: e.clientY, left, top: topPx };
      card.style.zIndex = ++top;
      card.classList.add("is-dragging");
      card.setPointerCapture(e.pointerId);
    });
    card.addEventListener("pointermove", (e) => {
      if (!start) return;
      const maxL = stage.clientWidth - card.offsetWidth;
      const maxT = stage.clientHeight - card.offsetHeight;
      const l = Math.min(maxL, Math.max(0, start.left + e.clientX - start.x));
      const t = Math.min(maxT, Math.max(-40, start.top + e.clientY - start.y));
      card.style.left = `${l}px`;
      card.style.top = `${t}px`;
    });
    const drop = () => { start = null; card.classList.remove("is-dragging"); };
    card.addEventListener("pointerup", drop);
    card.addEventListener("pointercancel", drop);
  });

  // a resize back to mobile clears dragged positions so the grid layout takes over
  desktop.addEventListener("change", () => {
    stage.querySelectorAll(".vcard").forEach((c) => { c.style.left = ""; c.style.top = ""; c.style.zIndex = ""; });
  });
})();
