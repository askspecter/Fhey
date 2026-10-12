/* Docs page: copy buttons, tabs, scroll spy, on-this-page, mobile sidebar, search. */
(() => {
  "use strict";

  const { $, $$, copy, lenis, scrollOffset } = window.FC;
  const content = $("#content");
  const sidebar = $("#sidebar");
  const menuBtn = $("#docsMenu");
  const menuLabel = $("#docsMenuLabel");

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -scrollOffset() });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  /* ───── Copy buttons on code blocks ───── */
  $$("pre.code", content).forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "code-copy";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.addEventListener("click", () => {
      const clone = pre.querySelector("code").cloneNode(true);
      clone.querySelectorAll(".cm").forEach((c) => c.remove());
      const text = clone.textContent.split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").trim();
      copy(text);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
    pre.appendChild(btn);
  });

  /* ───── Tabs ───── */
  $$("[data-tabs]").forEach((tabs) => {
    const btns = $$(".tabs__list button", tabs);
    const panels = $$(".tabs__panel", tabs);
    btns.forEach((b, i) =>
      b.addEventListener("click", () => {
        btns.forEach((x, j) => { x.classList.toggle("is-active", i === j); x.setAttribute("aria-selected", String(i === j)); });
        panels.forEach((p, j) => p.classList.toggle("is-active", i === j));
      })
    );
  });

  /* ───── On this page ───── */
  const sections = $$(".doc", content);
  const toc = $("#toc");
  toc.innerHTML = sections
    .map((s) => {
      const h = $("h2, h3", s);
      return `<a href="#${s.id}" class="${h.tagName === "H3" ? "sub" : ""}" data-id="${s.id}">${h.textContent}</a>`;
    })
    .join("");
  $$("a", toc).forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); goTo(a.dataset.id); }));

  /* ───── Scroll spy ───── */
  const sideLinks = $$(".sidebar a");
  const tocLinks = $$("a", toc);
  let current = "";
  const spy = () => {
    const line = scrollOffset() + 40;
    let id = sections[0].id;
    for (const s of sections) {
      if (s.getBoundingClientRect().top - line <= 0) id = s.id;
      else break;
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) id = sections[sections.length - 1].id;
    if (id === current) return;
    current = id;
    sideLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    tocLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.id === id));
    const active = sideLinks.find((a) => a.getAttribute("href") === `#${id}`);
    if (active) menuLabel.textContent = active.textContent;
  };
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* ───── Mobile sidebar ───── */
  const close = document.createElement("button");
  close.className = "icon-btn sidebar__close";
  close.setAttribute("aria-label", "Close navigation");
  close.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  sidebar.prepend(close);
  const setSide = (open) => {
    sidebar.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener("click", () => setSide(true));
  close.addEventListener("click", () => setSide(false));
  sideLinks.forEach((a) => a.addEventListener("click", () => setSide(false)));

  /* ───── Search ───── */
  const search = $("#search");
  const input = $("#searchInput");
  const results = $("#searchResults");
  const groupOf = (id) => {
    const link = sideLinks.find((a) => a.getAttribute("href") === `#${id}`);
    return link ? link.closest(".sidebar__group").querySelector("h4").textContent : "";
  };
  const index = [
    ...sections.map((s) => ({ id: s.id, title: $("h2, h3", s).textContent, group: groupOf(s.id), text: s.textContent.toLowerCase() })),
    ...$$(".cmdblock", content).map((c) => ({ id: c.id, title: $(".cmdblock__head code", c).textContent, group: "Command", text: c.textContent.toLowerCase() })),
  ];
  const esc = (s) => s.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
  let hits = [];
  let sel = 0;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      hits = index.filter((d) => ["installation", "quick-start", "cmd-lb", "cmd-live", "cmd-radar", "offline", "configuration"].includes(d.id));
    } else {
      const words = q.split(/\s+/);
      hits = index
        .map((d) => {
          const t = d.title.toLowerCase();
          if (!words.every((w) => t.includes(w) || d.text.includes(w))) return null;
          const score = words.reduce((n, w) => n + (t.includes(w) ? 10 : 0) + (t.startsWith(w) ? 5 : 0), 0) - (d.group === "Command" ? 0 : 1);
          return { ...d, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
    }
    sel = 0;
    if (!hits.length) { results.innerHTML = `<li class="search__empty">No results for "${esc(input.value)}"</li>`; return; }
    const mark = (s) => {
      let out = esc(s);
      q.split(/\s+/).filter(Boolean).forEach((w) => {
        out = out.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>");
      });
      return out;
    };
    results.innerHTML = hits
      .map((h, i) => `<li><a href="#${h.id}" data-i="${i}" class="${i === 0 ? "is-active" : ""}" role="option"><span>${q ? mark(h.title) : esc(h.title)}</span><small>${esc(h.group)}</small></a></li>`)
      .join("");
  };
  const setSel = (i) => {
    sel = (i + hits.length) % hits.length;
    $$("a", results).forEach((a, j) => a.classList.toggle("is-active", j === sel));
    $$("a", results)[sel]?.scrollIntoView({ block: "nearest" });
  };
  const openSearch = () => {
    search.hidden = false;
    input.value = "";
    render();
    document.body.classList.add("is-locked");
    lenis?.stop();
    input.focus();
  };
  const closeSearch = () => {
    search.hidden = true;
    document.body.classList.remove("is-locked");
    lenis?.start();
  };
  const pick = (i) => { const h = hits[i]; if (!h) return; closeSearch(); setTimeout(() => goTo(h.id), 20); };

  $("#searchOpen").addEventListener("click", openSearch);
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $("#searchKbd").textContent = "⌘K";
  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(sel + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(sel - 1); }
    else if (e.key === "Enter") { e.preventDefault(); pick(sel); }
  });
  results.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    pick(+a.dataset.i);
  });
  $$("[data-close]", search).forEach((el) => el.addEventListener("click", closeSearch));
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      search.hidden ? openSearch() : closeSearch();
    } else if (e.key === "Escape" && !search.hidden) {
      closeSearch();
    }
  });

  /* Land on the right section when arriving with a hash. */
  if (location.hash.length > 1) setTimeout(() => goTo(location.hash.slice(1)), 60);
})();
