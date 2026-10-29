/* OoO — Out of Ordinary · shared behaviour (no dependencies) */
(() => {
  const doc = document.documentElement;
  doc.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Every page opens at the top ----------
     Browsers (and embedded previews) may restore the previous scroll offset when
     moving between pages; unless a #section link was followed, start at the top. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const toTop = () => { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" }); };
  toTop();
  let userMoved = false;
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((t) =>
    window.addEventListener(t, () => (userMoved = true), { once: true, passive: true })
  );
  window.addEventListener("load", () => { if (!userMoved) toTop(); });
  window.addEventListener("pageshow", (e) => { if (e.persisted) toTop(); });

  /* ---------- Sticky nav: frosted bar once the page leaves the top ---------- */
  const navEl = document.querySelector(".nav");
  if (navEl) {
    // sections the bar can sit over that are dark (photo or wine), so the logo flips to light
    const darkZones = [...document.querySelectorAll(".who, .cta-torn, .s-hero, .ab-true, .case-hero, .ct-info, .footer, [data-nav-dark]")];
    const setNav = () => {
      navEl.classList.toggle("is-scrolled", window.scrollY > 24);
      const y = navEl.offsetHeight / 2, x = 80;
      const onDark = darkZones.some((z) => {
        const r = z.getBoundingClientRect();
        return r.top <= y && r.bottom >= y && r.left <= x && r.right >= x;
      });
      navEl.classList.toggle("is-on-dark", onDark);
    };
    window.addEventListener("scroll", setNav, { passive: true });
    setNav();
  }

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

  /* ---------- Split text into word spans ----------
     .stagger       → each word rises out of its own masked slot (.wm > .w)
     .scroll-words  → plain word spans lit up by scroll position (see below) */
  const splitWords = (el, masked) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(part);
            const w = document.createElement("span");
            w.className = "w";
            w.style.setProperty("--i", i++);
            w.textContent = part;
            if (masked) {
              const m = document.createElement("span");
              m.className = "wm";
              m.append(w);
              frag.append(m);
            } else frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  };
  document.querySelectorAll(".stagger").forEach((el) => splitWords(el, true));

  /* ---------- Scroll-lit text: words brighten as the reader scrolls past ---------- */
  const litEls = [...document.querySelectorAll(".scroll-words")];
  litEls.forEach((el) => splitWords(el, false));
  if (litEls.length && !reduceMotion) {
    const FROM = 0.16;
    const update = () => {
      const vh = window.innerHeight;
      litEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        // 0 when the block's top reaches 85% of the viewport, 1 when its bottom reaches 45%
        const p = Math.min(1, Math.max(0, (0.85 * vh - r.top) / (0.4 * vh + r.height)));
        const words = el._words || (el._words = [...el.querySelectorAll(".w")]);
        const n = words.length;
        words.forEach((w, i) => {
          const a = i / n - 0.08, b = i / n + 0.04;
          const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
          w.style.opacity = (FROM + (1 - FROM) * t).toFixed(3);
        });
      });
    };
    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- Stacking step cards (desktop) ----------
     Each step pins under the previous one; earlier cards shrink slightly. */
  const stackMq = window.matchMedia("(min-width: 981px)");
  document.querySelectorAll(".stack").forEach((stack) => {
    const items = [...stack.querySelectorAll(".stack__list > li")];
    const n = items.length;
    items.forEach((li, i) => li.style.setProperty("--si", i));
    if (reduceMotion) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      if (!stackMq.matches) { items.forEach((li) => (li.style.scale = "")); return; }
      items.forEach((li, i) => {
        const next = items[i + 1];
        if (!next) return (li.style.scale = "");
        // how far the following card has travelled over this one (0 → 1)
        const gap = next.getBoundingClientRect().top - li.getBoundingClientRect().top;
        const t = Math.min(1, Math.max(0, 1 - gap / li.offsetHeight));
        li.style.scale = (1 - 0.04 * (n - 1 - i) * t).toFixed(4);
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
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

  /* ---------- Marquee: always wide enough to never show a gap ----------
     The track is two identical halves scrolled by -50%. Each half repeats the
     logo group until it is at least as wide as the viewport, so wide screens
     never see the end of the strip. Speed stays constant (~40px/s). */
  document.querySelectorAll(".marquee").forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    const source = track && track.querySelector(".marquee__group");
    if (!source) return;
    const build = () => {
      const groupW = source.getBoundingClientRect().width;
      if (!groupW) return;
      const perHalf = Math.max(1, Math.ceil(marquee.clientWidth / groupW));
      if (track.children.length !== perHalf * 2) {
        track.replaceChildren(source);
        for (let i = 1; i < perHalf * 2; i++) {
          const copy = source.cloneNode(true);
          copy.setAttribute("aria-hidden", "true");
          copy.querySelectorAll("img").forEach((img) => (img.alt = ""));
          track.append(copy);
        }
      }
      track.style.animationDuration = `${(groupW * perHalf) / 40}s`;
    };
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(build, 150); });
    if (document.readyState === "complete") build(); else window.addEventListener("load", build);
    build();
  });

  /* ---------- Home hero: the bridge drifts slower than the page ---------- */
  const bridge = document.querySelector(".hero__bridge");
  if (bridge && !reduceMotion) {
    let ticking = false;
    const drift = () => {
      ticking = false;
      const y = Math.min(window.scrollY, window.innerHeight * 1.2);
      bridge.style.setProperty("--hero-shift", `${(y * 0.14).toFixed(1)}px`);
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
