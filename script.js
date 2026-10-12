(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ─────────────── Intro ─────────────── */
  const INTRO_MS = reduced ? 0 : 2300;
  if (!reduced) document.body.classList.add("is-locked");
  setTimeout(() => {
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-ready");
    $$(".hero .reveal").forEach((el, i) => {
      el.style.setProperty("--d", `${0.35 + i * 0.12}s`);
      el.classList.add("is-in");
    });
  }, INTRO_MS);
  setTimeout(() => $("#intro")?.remove(), INTRO_MS + 1200);

  /* ─────────────── Starfield ─────────────── */
  const canvas = $("#stars");
  const ctx = canvas.getContext("2d");
  let stars = [];
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 9000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: Math.random() * 0.8 + 0.2,
      t: Math.random() * Math.PI * 2,
    }));
  };
  resize();
  window.addEventListener("resize", resize);

  let scrollY = window.scrollY;
  const drawStars = (time) => {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const y = (s.y - scrollY * s.z * 0.15) % H;
      const yy = y < 0 ? y + H : y;
      const a = 0.25 + 0.55 * s.z * (0.6 + 0.4 * Math.sin(time * 0.001 * s.z + s.t));
      ctx.fillStyle = `rgba(220, 228, 255, ${a})`;
      ctx.fillRect(s.x, yy, s.z * 1.3, s.z * 1.3);
    }
    if (!reduced) requestAnimationFrame(drawStars);
  };
  requestAnimationFrame(drawStars);

  /* ─────────────── Nav ─────────────── */
  const nav = $("#nav");
  const burger = $("#burger");
  const onScroll = () => {
    scrollY = window.scrollY;
    nav.classList.toggle("is-scrolled", scrollY > 30);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
  });
  $$(".nav__links a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
    })
  );

  /* ─────────────── Hero parallax ─────────────── */
  if (!reduced) {
    const blades = $$(".blade");
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    });
    const loop = () => {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      const sy = Math.min(scrollY, window.innerHeight);
      blades.forEach((b) => {
        const d = parseFloat(b.dataset.depth);
        b.style.transform = `translate3d(${cx * d * 900}px, ${cy * Math.abs(d) * 600 + sy * 0.25}px, 0) rotate(${cx * d * 40}deg)`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ─────────────── Reveal on scroll ─────────────── */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal:not(.hero .reveal), .step").forEach((el) => io.observe(el));

  /* ─────────────── Counters & gauge ─────────────── */
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        const el = e.target;
        const to = +el.dataset.count;
        const suffix = el.dataset.suffix || "";
        const start = performance.now();
        const dur = reduced ? 1 : 1600;
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))) + (p === 1 ? suffix : "");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countIO.observe(el));

  const gauge = $(".gauge");
  if (gauge) {
    const gIO = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        gIO.disconnect();
        const score = +gauge.dataset.score;
        const fill = $(".gauge__fill", gauge);
        const len = fill.getTotalLength();
        fill.style.strokeDasharray = len;
        fill.style.strokeDashoffset = len;
        requestAnimationFrame(() => (fill.style.strokeDashoffset = len * (1 - score / 100)));
        const b = $(".gauge__val b", gauge);
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / 2000, 1);
          b.textContent = Math.round(score * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    gIO.observe(gauge);
  }

  /* ─────────────── Card spotlight ─────────────── */
  $$(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ─────────────── Tilt ─────────────── */
  const tilt = $("#tilt");
  if (tilt && !reduced) {
    tilt.addEventListener("pointermove", (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      tilt.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
      tilt.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
      tilt.style.setProperty("--gx", `${x * 100}%`);
      tilt.style.setProperty("--gy", `${y * 100}%`);
    });
    tilt.addEventListener("pointerleave", () => {
      tilt.style.setProperty("--rx", "0deg");
      tilt.style.setProperty("--ry", "0deg");
    });
  }

  /* ─────────────── Clipboard ─────────────── */
  const toast = $("#toast");
  let toastT;
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      ta.remove();
    }
    toast.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("is-on"), 1800);
  };
  $$("[data-copy]").forEach((b) => b.addEventListener("click", () => copy(b.dataset.copy)));

  /* ─────────────── Install tabs ─────────────── */
  const INSTALL = {
    script: "curl -fsSL https://raw.githubusercontent.com/FomoCLI/FomoCLI/main/scripts/install.sh | sh",
    go: "go install github.com/FomoCLI/FomoCLI/cmd/fomocli@latest",
    source: "git clone https://github.com/FomoCLI/FomoCLI && cd FomoCLI && make build && ./fomo",
    bin: "open https://github.com/FomoCLI/FomoCLI/releases   # Linux · macOS · Windows (amd64/arm64)",
  };
  const installCode = $("#installCode");
  $$("[data-install]").forEach((b) =>
    b.addEventListener("click", () => {
      $$("[data-install]").forEach((x) => x.classList.toggle("is-active", x === b));
      installCode.textContent = INSTALL[b.dataset.install];
    })
  );
  $("#installCopy").addEventListener("click", () => copy(installCode.textContent.replace(/\s+#.*$/, "")));

  /* ─────────────── Commands ─────────────── */
  const C = (cmd, desc, cost) => ({ cmd, desc, cost });
  const COMMANDS = {
    market: [
      C("fomocli lb [24h|7d|30d|all]", "Top traders by PnL. <code>--sort volume|trades|followers</code>, <code>--verified</code>, <code>-n</code>", "250"),
      C("fomocli tokens [trending|most-held|graduated]", "FOMO token boards: price, 24h, mcap, holders", "250"),
      C("fomocli token &lt;addr&gt; [stats]", "Buy/sell flow over 5m · 1h · 4h · 24h, net flow, top-10 concentration", "250"),
      C("fomocli token &lt;addr&gt; devs", "Deployer &amp; insider positions with their own thesis (rug signal)", "250"),
      C("fomocli token &lt;addr&gt; holders", "Tracked traders holding it (smart money)", "250"),
      C("fomocli token &lt;addr&gt; theses", "What traders wrote about it. <code>--sort likes</code>, <code>--threshold</code>, <code>--pages</code>", "1,250/page"),
      C("fomocli activity", "Several traders hitting one coin at once. <code>--side</code>, <code>--min-traders</code>", "250"),
      C("fomocli search &lt;query&gt;", "Traders and tokens by name. <code>--type</code>, <code>--tokens</code>", "250"),
      C("fomocli theses", "Latest theses. <code>--chain</code>, <code>--sort equity</code>, <code>--min-equity</code>", "1,250"),
    ],
    traders: [
      C("fomocli trader &lt;handle&gt; profile", "Wallets (Solana + EVM), PnL 24h/7d/30d/all, volume, trades, followers, avg hold, clan, account age", "2,500"),
      C("fomocli t &lt;handle&gt; positions", "Open &amp; closed positions: entry, exit/now, cost, realized/unrealized, win rate. <code>--status</code>, <code>--sort</code>, <code>--deep</code>", "250/page"),
      C("fomocli t &lt;handle&gt; swaps", "Individual fills", "250"),
      C("fomocli t &lt;handle&gt; balances", "Multi-chain portfolio, per-chain split, allocation bars. <code>--chain</code>", "250"),
      C("fomocli t &lt;handle&gt; following|followers", "Their network, each annotated with PnL 24h, volume, trades. <code>--sort pnl</code>", "250"),
      C("fomocli t &lt;handle&gt; spotlight", "FOMO's own pick of their best trades and theses", "250"),
      C("fomocli t &lt;handle&gt; theses", "Everything they wrote. <code>--sort likes</code>", "1,250"),
      C("fomocli whois &lt;userId&gt;", "Resolve a user ID to a full profile", "2,500"),
      C("fomocli trade &lt;tradeId&gt; [comments]", "One trade and its comment thread", "250"),
    ],
    realtime: [
      C("fomocli live", "Streaming ticker. <code>--trader</code>, <code>--chain</code>, <code>--token</code>, <code>--type thesis</code>, <code>--min-usd</code>, <code>--bell</code>, <code>--onchain</code>", "0"),
      C("fomocli watch &lt;handle&gt;", "Follow one trader live (copy-trading view)", "0"),
      C("fomocli alerts", "REST snapshot of the feed. <code>--type whale</code>, <code>--since</code>", "125"),
      C("fomocli dash", "Full-screen dashboard — <code>1-4</code> tabs, <code>↑↓</code>, <code>enter</code>, <code>w</code> window, <code>b</code> board, <code>r</code> refresh, <code>q</code> quit", "per tab"),
    ],
    alpha: [
      C("fomocli radar", "Swarm radar: alarm when several traders pile into the same token within minutes. <code>--min-traders</code>, <code>--window</code>, <code>--notify</code>", "0"),
      C("fomocli scan &lt;address&gt;", "Rug scanner: one 0–100 risk score from flow, concentration, dev exits and smart money — every reason listed", "750"),
      C("fomocli card &lt;handle&gt;", "A 1200×675 PNG trader card, ready for X or Telegram. <code>--window 7d</code>, <code>--send telegram</code>", "2,750"),
      C("fomocli notify setup|test", "Connect a Telegram bot or Discord webhook, then add <code>--notify telegram,discord</code>", "—"),
    ],
    setup: [
      C("fomocli auth login|status|logout", "Store your FOMO API key (saved with <code>0600</code> permissions)", "—"),
      C("fomocli config list|get|set|path", "<code>cache_ttl</code>, <code>default_window</code>, <code>default_chain</code>, <code>theme</code>, <code>base_url</code>", "—"),
      C("fomocli status [--watch]", "API status", "0"),
      C("fomocli credits", "What you've spent and what's left", "—"),
      C("fomocli cache ls|clear|path", "Everything available offline", "—"),
      C("fomocli api &lt;path&gt; -p key=value", "Call any endpoint, get raw JSON", "varies"),
      C("fomocli completion bash|zsh|fish|powershell", "Shell completion", "—"),
    ],
  };
  const panel = $("#cmdPanel");
  const ink = $(".cmd__ink");
  const renderGroup = (g) => {
    panel.innerHTML = COMMANDS[g]
      .map(
        (c, i) => `<div class="cmd__row" style="animation-delay:${i * 45}ms">
          <code>${c.cmd}</code>
          <p>${c.desc}</p>
          <span class="cost${c.cost === "0" ? " cost--free" : ""}">${c.cost === "0" ? "0 · free" : c.cost}</span>
        </div>`
      )
      .join("");
  };
  const moveInk = (btn) => {
    ink.style.width = `${btn.offsetWidth}px`;
    ink.style.height = `${btn.offsetHeight}px`;
    ink.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
  };
  const groupBtns = $$("[data-group]");
  groupBtns.forEach((b) =>
    b.addEventListener("click", () => {
      groupBtns.forEach((x) => {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-selected", String(x === b));
      });
      moveInk(b);
      renderGroup(b.dataset.group);
    })
  );
  renderGroup("market");
  const syncInk = () => moveInk($("[data-group].is-active"));
  window.addEventListener("resize", syncInk);
  document.fonts?.ready.then(syncInk);
  syncInk();

  /* ─────────────── Terminal scenes ─────────────── */
  const sp = (cls, t) => `<span class="${cls}">${t}</span>`;
  const g = (t) => sp("green", t);
  const r = (t) => sp("red", t);
  const m = (t) => sp("muted", t);
  const st = (t) => sp("steel", t);
  const bo = (t) => sp("t", t);
  const B = (t) => sp("b", t);
  const hd = (t) => sp("hd", t);
  const credit = (c, left) => `  ${sp("gold", "⚡")} ${m(`${c} credits · ${left} left`)}`;

  const SCENES = {
    lb: {
      cmd: "fomocli --demo lb",
      out: [
        "",
        `${sp("badi", "▌Leaderboard · 24H")}  ${m("captured 2m ago")}`,
        "",
        `  ${hd("TRADERS")}    ${hd("COMBINED PNL")}    ${hd("COMBINED VOLUME")}`,
        `  ${bo("6")}          ${g("+$321.5K")}        ${bo("$757.6K")}`,
        "",
        `   ${hd("#  TRADER                         PNL                 VOLUME  TRADES  FOLLOWERS  HOLDS")}`,
        `  ${B("───────────────────────────────────────────────────────────────────────────────────────")}`,
        `  🥇  ${st("@CryptoKaleo")} ${sp("green", "✔")} K A L E O  ${g("+$151.4K")}  ${sp("bar", "████████████")}  $119.2K      73        20K      4`,
        `  🥈  ${st("@frankdegods")} ${sp("green", "✔")} frank       ${g("+$98.2K")}  ${sp("bar", "███████▊    ")}  $402.3K      51     249.5K     12`,
        `  🥉  ${st("@starcatcher444")} star       ${g("+$45.1K")}  ${sp("bar", "███▌        ")}     $88K     140       3.3K      7`,
        `   4  ${st("@theveeman")} vee             ${g("+$21.9K")}  ${sp("bar", "█▋          ")}     $51K      33        812      3`,
        `   5  ${st("@laifu")}                        ${g("+$8K")}  ${sp("bar", "▋           ")}   $20.1K      19        402      2`,
        `   6  ${st("@ansem")} ${sp("green", "✔")}                    ${r("-$3.1K")}  ${sp("bar", "▏           ")}     $77K      12       120K      5`,
        "",
        credit("250", "249,750"),
      ],
    },
    radar: {
      cmd: "fomocli --demo radar --min-traders 3",
      out: [
        "",
        `${sp("badi", "▌Swarm radar")}  ${m("watching live feed · min 3 traders · window 30m · 0 credits")}`,
        "",
        `  ${m("09:01:12")}  ${st("@IOnlyBuyTekCoins")}  ${g("BUY")}   $STONK   ${bo("$3.2K")}   ${m("solana")}`,
        `  ${m("09:07:40")}  ${st("@EvilPanda")}         ${g("BUY")}   $STONK   ${bo("$3K")}     ${m("solana")}`,
        `  ${m("09:12:03")}  ${st("@laifu")}             ${r("SELL")}  $PONS    ${bo("$1.1K")}   ${m("robinhood")}`,
        `  ${m("09:20:25")}  ${st("@TEFL0ND0N")}         ${g("BUY")}   $STONK   ${bo("$10.1K")}  ${m("solana")}`,
        "",
        `  ${B("╭────────────────────────────────────────────────────────────────────────────────────╮")}`,
        `  ${B("│")} ${r("◆  SWARM BUY")}  ${bo("$STONK")}  ${m("solana   09:20:25")}                                            ${B("│")}`,
        `  ${B("│")} ${bo("3 traders")} · 3 buys · ${g("$16.3K")} in 24m                                                 ${B("│")}`,
        `  ${B("│")} ${st("@TEFL0ND0N")} $10.1K · ${st("@IOnlyBuyTekCoins")} $3.2K · ${st("@EvilPanda")} $3K                       ${B("│")}`,
        `  ${B("│")} ${m("6GmAFSYs4gk3FDao5FzzySQpPZaWsa4rUJHacpMpUNgx")}   ${m("check it:")} fomocli scan 6GmAFS…pUNgx ${B("│")}`,
        `  ${B("╰────────────────────────────────────────────────────────────────────────────────────╯")}`,
        "",
        `  ${m("listening…")}`,
      ],
    },
    scan: {
      cmd: "fomocli --demo scan 6GmAFS…pUNgx",
      out: [
        "",
        `${sp("badi", "▌Rug scan")}  ${bo("$STONK")}  ${m("solana · sample data")}`,
        "",
        `  ${hd("RISK")}   ${r("██████████████████████████████▌            ")}  ${bo("72")}${m("/100")}  ${sp("bad", "HIGH")}`,
        "",
        `  ${hd("WHY")}`,
        `  ${r("▲")}  Top-10 wallets hold ${bo("61%")} of supply                       ${m("concentration")}`,
        `  ${r("▲")}  Deployer sold ${bo("80%")} of their bag in the last 4h           ${m("dev exit")}`,
        `  ${r("▲")}  Sell volume ${bo("2.3×")} buy volume over 1h                    ${m("flow")}`,
        `  ${sp("gold", "●")}  2 insiders still holding, thesis says "long"              ${m("insiders")}`,
        `  ${g("▼")}  3 tracked smart-money traders are holders                ${m("smart money")}`,
        "",
        `  ${hd("FLOW")}     ${hd("5m")}        ${hd("1h")}        ${hd("4h")}        ${hd("24h")}`,
        `  net      ${r("-$4.1K")}    ${r("-$22.8K")}   ${r("-$31.0K")}   ${g("+$12.4K")}`,
        "",
        credit("750", "249,000"),
      ],
    },
    live: {
      cmd: "fomocli --demo live --chain solana",
      out: [
        "",
        `${sp("badi", "▌Live")}  ${m("app feed · solana · 0 credits ·")} ${g("● connected")}`,
        "",
        `  ${m("12:04:01")}  ${st("@frankdegods")}      ${g("BUY ")}  $WIF       ${bo("$12.0K")}  ${m("@ 2.41")}`,
        `  ${m("12:04:03")}  ${st("@CryptoKaleo")}      ${g("BUY ")}  $FARTCOIN  ${bo("$4.4K")}   ${m("@ 1.12")}`,
        `  ${m("12:04:07")}  ${st("@starcatcher444")}   ${r("SELL")}  $ANSEM     ${bo("$880")}    ${m("+31% realized")}`,
        `  ${m("12:04:11")}  ${st("@ansem")}            ${sp("pink", "THESIS")} $ANSEM  ${m('"cult coins win the cycle"')}`,
        `  ${m("12:04:15")}  ${st("@theveeman")}        ${g("BUY ")}  $STONK     ${bo("$51.0K")}  ${sp("badw", "WHALE")}`,
        `  ${m("12:04:18")}  ${st("@laifu")}            ${g("BUY ")}  $PONS      ${bo("$2.2K")}   ${m("@ 0.0048")}`,
        `  ${m("12:04:22")}  ${st("@frankdegods")}      ${r("SELL")}  $WIF       ${bo("$6.1K")}   ${m("-4% realized")}`,
        "",
        `  ${m("streaming… ctrl+c to stop")}`,
      ],
    },
  };

  const term = $("#termBody");
  const termTabs = $$("[data-scene]");
  let runId = 0;
  let autoplay = true;
  let started = false;
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const PROMPT = `${g("➜")} ${st("~")} `;
  const order = Object.keys(SCENES);

  const play = async (name) => {
    const id = ++runId;
    termTabs.forEach((t) => {
      t.classList.toggle("is-active", t.dataset.scene === name);
      t.setAttribute("aria-selected", String(t.dataset.scene === name));
    });
    const scene = SCENES[name];
    if (reduced) {
      term.innerHTML = PROMPT + scene.cmd + "\n" + scene.out.join("\n");
      return;
    }
    let typed = "";
    term.innerHTML = PROMPT + '<span class="cursor"></span>';
    await sleep(400);
    for (const ch of scene.cmd) {
      if (id !== runId) return;
      typed += ch;
      term.innerHTML = PROMPT + typed + '<span class="cursor"></span>';
      await sleep(28 + Math.random() * 50);
    }
    await sleep(320);
    let html = PROMPT + typed + "\n";
    for (const line of scene.out) {
      if (id !== runId) return;
      html += line + "\n";
      term.innerHTML = html + '<span class="cursor"></span>';
      await sleep(name === "live" ? 380 : 70);
    }
    await sleep(4200);
    if (id !== runId || !autoplay) return;
    play(order[(order.indexOf(name) + 1) % order.length]);
  };

  termTabs.forEach((t) =>
    t.addEventListener("click", () => {
      autoplay = false;
      play(t.dataset.scene);
    })
  );

  const tIO = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !started) {
        started = true;
        play("lb");
      }
    },
    { threshold: 0.3 }
  );
  tIO.observe($("#terminal"));
})();
