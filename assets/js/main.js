/* OoO — Out of Ordinary · shared behaviour (no dependencies) */
(() => {
  const doc = document.documentElement;
  doc.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".nav__toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".mobile-menu a").forEach((a) =>
      a.addEventListener("click", () => document.body.classList.remove("menu-open"))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") document.body.classList.remove("menu-open");
    });
  }

  /* ---------- Word stagger: split text into .w spans ---------- */
  document.querySelectorAll(".stagger").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(part);
            const span = document.createElement("span");
            span.className = "w";
            span.style.setProperty("--i", i++);
            span.textContent = part;
            frag.append(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Scroll reveal: play once per element ---------- */
  const revealEls = document.querySelectorAll("[data-reveal], .stagger");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Accordion (FAQ) ---------- */
  document.querySelectorAll(".faq__item").forEach((item) => {
    const q = item.querySelector(".faq__q");
    if (!q) return;
    q.setAttribute("aria-expanded", String(item.classList.contains("is-open")));
    q.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Carousel (Brand Showcase) ----------
     Cards sit in 5 slots (-2..2). Prev/next, numbers, side-card click,
     swipe/drag and arrow keys rotate the deck. */
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const cards = [...root.querySelectorAll(".carousel__card")];
    const n = cards.length;
    const title = root.querySelector("[data-carousel-title]");
    const desc = root.querySelector("[data-carousel-desc]");
    const dots = [...root.querySelectorAll("[data-carousel-to]")];
    const caption = root.querySelector(".carousel__caption");
    let index = 0;

    const render = () => {
      cards.forEach((card, i) => {
        let off = (i - index) % n;
        if (off > n / 2) off -= n;
        if (off < -n / 2) off += n;
        card.dataset.slot = off;
        card.setAttribute("aria-hidden", off === 0 ? "false" : "true");
        card.tabIndex = off === 0 ? 0 : -1;
      });
      const active = cards[index];
      if (caption) {
        caption.classList.add("is-swapping");
        setTimeout(() => {
          if (title) title.textContent = active.dataset.title || "";
          if (desc) desc.innerHTML = active.dataset.desc || "";
          caption.classList.remove("is-swapping");
        }, 180);
      }
      dots.forEach((d) => {
        const on = Number(d.dataset.carouselTo) === index;
        d.classList.toggle("is-active", on);
        d.setAttribute("aria-current", on ? "true" : "false");
      });
    };
    const go = (i) => { index = (i + n) % n; render(); };

    root.querySelector("[data-carousel-prev]")?.addEventListener("click", () => go(index - 1));
    root.querySelector("[data-carousel-next]")?.addEventListener("click", () => go(index + 1));
    dots.forEach((d) => d.addEventListener("click", () => go(Number(d.dataset.carouselTo))));
    cards.forEach((card, i) =>
      card.addEventListener("click", (e) => {
        if (i !== index) { e.preventDefault(); go(i); }
      })
    );
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    });

    // Drag / swipe
    const stage = root.querySelector(".carousel__stage");
    let startX = null, moved = false;
    stage.addEventListener("pointerdown", (e) => { startX = e.clientX; moved = false; });
    stage.addEventListener("pointermove", (e) => { if (startX !== null && Math.abs(e.clientX - startX) > 8) moved = true; });
    const end = (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointerleave", end);
    stage.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    render();
  });

  /* ---------- Contact form → toast ---------- */
  const toast = document.querySelector(".toast");
  const showToast = (msg) => {
    if (!toast) return;
    if (msg) toast.querySelector("[data-toast-text]").textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("is-show"), 2800);
  };
  document.querySelectorAll("form[data-contact]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const endpoint = form.getAttribute("action");
      // Until a Formspree (or similar) endpoint is set, just confirm locally.
      if (endpoint && endpoint.startsWith("http")) {
        try {
          const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error();
        } catch {
          showToast("Something went wrong — please email us directly.");
          return;
        }
      }
      form.reset();
      showToast("Message sent — we'll be in touch within 2 working days.");
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
