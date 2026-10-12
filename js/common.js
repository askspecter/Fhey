/* Shared behaviour for every page: nav, mobile menu, cursor, clipboard, smooth scroll. */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ───── Smooth scroll (Lenis), synced with GSAP when present ───── */
  const scrollOffset = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue("--scroll-offset"), 10) || 70;
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    document.documentElement.classList.add("has-lenis");
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    $$('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -scrollOffset() });
        history.replaceState(null, "", id);
      })
    );
  }

  /* ───── Nav: solid on scroll, hide on scroll down ───── */
  const nav = $("#nav");
  const burger = $("#burger");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 30);
    if (!nav.classList.contains("is-open")) nav.classList.toggle("is-hidden", y > 400 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove("is-hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-locked", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger?.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$(".nav__links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ───── Cursor ───── */
  if (finePointer && !reduced) {
    const ring = document.createElement("div");
    const dot = document.createElement("div");
    ring.className = "cursor is-hidden";
    dot.className = "cursor-dot is-hidden";
    document.body.append(ring, dot);
    let x = -100, y = -100, rx = -100, ry = -100;
    window.addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      ring.classList.remove("is-hidden");
      dot.classList.remove("is-hidden");
    });
    document.addEventListener("pointerleave", () => { ring.classList.add("is-hidden"); dot.classList.add("is-hidden"); });
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("pointerover", (e) => {
      ring.classList.toggle("is-hover", !!e.target.closest("a, button, [data-hover]"));
    });

    /* Magnetic buttons */
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.18}px, ${my * 0.28}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ───── Clipboard ───── */
  const toast = $("#toast");
  let toastT;
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      ta.remove();
    }
    if (!toast) return;
    toast.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("is-on"), 1800);
  };
  $$("[data-copy]").forEach((b) => b.addEventListener("click", () => copy(b.dataset.copy)));

  window.FC = { $, $$, reduced, finePointer, lenis, copy, scrollOffset };
})();
