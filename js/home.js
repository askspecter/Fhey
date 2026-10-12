/* Home page: boot sequence, hero intro, scroll choreography, terminal demo, command tabs. */
(() => {
  "use strict";

  const { $, $$, reduced, finePointer, copy } = window.FC;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const animated = !!(gsap && ST) && !reduced;
  if (animated) {
    gsap.registerPlugin(ST);
    document.documentElement.classList.add("has-gsap");
  }

  /* ════════════ Text splitting ════════════ */
  const splitWords = (el, wrap) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(" "));
            else frag.appendChild(wrap(part));
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
  };
  $$(".split").forEach((el) =>
    splitWords(el, (word) => {
      const w = document.createElement("span");
      w.className = "w";
      const s = document.createElement("span");
      s.textContent = word;
      w.appendChild(s);
      return w;
    })
  );
  const manifesto = $("#manifesto");
  splitWords(manifesto, (word) => {
    const s = document.createElement("span");
    s.className = "mw";
    s.textContent = word;
    return s;
  });

  /* ════════════ Ticker (sample feed) ════════════ */
  const TICKS = [
    ["frankdegods", "buy", "PONS", "$40K", "robinhood"],
    ["CryptoKaleo", "sell", "WIF", "$6.1K", "solana"],
    ["TEFL0ND0N", "buy", "STONK", "$10.1K", "solana"],
    ["theveeman", "buy", "FARTCOIN", "$21.9K", "solana"],
    ["starcatcher444", "buy", "CACHE", "$2.4K", "robinhood"],
    ["ansem", "sell", "ANSEM", "$3.1K", "solana"],
    ["EvilPanda", "buy", "STONK", "$3K", "solana"],
    ["laifu", "buy", "PONS", "$2.2K", "robinhood"],
  ];
  const tickHTML = TICKS.map(
    ([who, side, tok, usd, chain]) =>
      `<span class="tick"><span class="side side--${side}">${side.toUpperCase()}</span><b>@${who}</b>$${tok} <b>${usd}</b><span class="muted">${chain}</span></span>`
  ).join("");
  $("#ticker").innerHTML = tickHTML + tickHTML;

  /* ════════════ Boot sequence ════════════ */
  const loader = $("#loader");
  const BOOT = [
    ["fomocli", "  boot"],
    ["ok", "config      ~/.config/fomocli"],
    ["ok", "cache       142 responses · 0 credits to replay"],
    ["ok", "api         connected · 38ms"],
    ["ok", "stream      app feed · websocket ready"],
    ["ok", "leaderboard 24h · 6 traders"],
  ];
  const log = $("#bootLog");
  const count = $("#bootCount");
  const bar = $("#bootBar");

  const reveal = () => {
    loader.classList.add("is-open");
    document.body.classList.remove("is-locked");
    window.FC.lenis?.start();
    window.dispatchEvent(new Event("fc:ready"));
    heroIntro();
    setTimeout(() => loader.remove(), 1500);
  };

  const boot = () => {
    if (reduced) { loader.remove(); document.body.classList.remove("is-locked"); window.dispatchEvent(new Event("fc:ready")); heroIntro(); return; }
    window.FC.lenis?.stop();
    window.scrollTo(0, 0);
    let seen = false;
    try { seen = sessionStorage.getItem("fc-booted") === "1"; sessionStorage.setItem("fc-booted", "1"); } catch { /* storage blocked */ }
    const dur = seen ? 900 : 2200;
    const start = performance.now();
    let shown = 0;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      count.textContent = String(Math.round(e * 100)).padStart(3, "0");
      bar.style.transform = `scaleX(${e})`;
      const want = Math.min(BOOT.length, Math.floor(p * (BOOT.length + 1)));
      while (shown < want) {
        const [k, v] = BOOT[shown++];
        log.innerHTML += k === "ok"
          ? `<span class="ok">[ ok ]</span> ${v}\n`
          : `<span class="w">${k}</span>${v}\n`;
      }
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(reveal, 250);
    };
    requestAnimationFrame(tick);
  };

  /* ════════════ Hero intro ════════════ */
  const heroIntro = () => {
    if (!animated) return;
    const tl = gsap.timeline({ delay: 0.35, defaults: { ease: "expo.out" } });
    tl.to("[data-hero-line]", { y: 0, duration: 1.6, stagger: 0.12 })
      .to("[data-hero]", { opacity: 1, y: 0, duration: 1.4, stagger: 0.1 }, 0.35);
  };

  /* ════════════ Scroll choreography ════════════ */
  if (animated) {
    // Hero content drifts up and fades as you leave it.
    gsap.to(".hero__inner", {
      yPercent: -18, opacity: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Headings: words rise out of a mask.
    $$(".split").forEach((el) => {
      gsap.to($$(".w > span", el), {
        y: 0, duration: 1.3, ease: "expo.out", stagger: 0.045,
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // Generic fade-ups.
    ST.batch(".fade-up", {
      start: "top 88%",
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 }),
    });

    // Manifesto: words light up with the scroll.
    gsap.to($$(".mw", manifesto), {
      opacity: 1, ease: "none", stagger: 0.1,
      scrollTrigger: { trigger: manifesto, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
    });

    // Terminal tilts flat as it arrives.
    gsap.fromTo("#terminal",
      { rotateX: 32, scale: 0.86, y: 40, opacity: 0.4 },
      { rotateX: 0, scale: 1, y: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: ".terminal-wrap", start: "top 95%", end: "top 30%", scrub: 0.8 } });

    // Features scroll sideways on desktop.
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1001px)", () => {
      const section = $("#features");
      const track = $("#featTrack");
      section.classList.add("is-horizontal");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: ".features__pin", start: "top top", end: () => `+=${dist()}`,
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => gsap.set("#featProgress", { scaleX: self.progress }),
        },
      });
      return () => { tw.scrollTrigger?.kill(); tw.kill(); gsap.set(track, { x: 0 }); section.classList.remove("is-horizontal"); };
    });

    // Outro word breathes in.
    gsap.fromTo("#outroWord",
      { letterSpacing: "0.08em", opacity: 0.2, yPercent: 30 },
      { letterSpacing: "-0.06em", opacity: 1, yPercent: 0, ease: "none",
        scrollTrigger: { trigger: "#outro", start: "top 95%", end: "top 25%", scrub: 0.8 } });

    window.addEventListener("load", () => ST.refresh());
    document.fonts?.ready.then(() => ST.refresh());
  }

  /* ════════════ Kicker scramble ════════════ */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_-=+";
  const scramble = (el) => {
    const final = el.dataset.text;
    let frame = 0;
    const total = 26;
    const run = () => {
      const p = frame / total;
      el.textContent = final
        .split("")
        .map((ch, i) => (ch === " " || i < p * final.length ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
      if (frame++ < total) requestAnimationFrame(run);
      else el.textContent = final;
    };
    run();
  };
  const scrIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      scrIO.unobserve(e.target);
      if (!reduced) scramble(e.target);
    });
  }, { threshold: 1 });
  $$("[data-scramble]").forEach((el) => { el.dataset.text = el.textContent; scrIO.observe(el); });

  /* ════════════ Feature card spotlight ════════════ */
  $$(".fcard").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ════════════ Gauge ════════════ */
  const gauge = $(".gauge");
  const gIO = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    gIO.disconnect();
    const score = +gauge.dataset.score;
    const fill = $(".gauge__fill", gauge);
    const len = fill.getTotalLength();
    fill.style.strokeDasharray = len;
    fill.style.strokeDashoffset = len;
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.strokeDashoffset = len * (1 - score / 100))));
    const b = $(".gauge__val b", gauge);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 2000, 1);
      b.textContent = Math.round(score * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.5 });
  gIO.observe(gauge);

  /* ════════════ Card tilt ════════════ */
  const tilt = $("#tilt");
  if (finePointer && !reduced) {
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

  /* ════════════ Install tabs ════════════ */
  const INSTALL = {
    script: "curl -fsSL https://raw.githubusercontent.com/FomoCLI/FomoCLI/main/scripts/install.sh | sh",
    go: "go install github.com/FomoCLI/FomoCLI/cmd/fomocli@latest",
    source: "git clone https://github.com/FomoCLI/FomoCLI && cd FomoCLI && make build && ./fomo",
    bin: "https://github.com/FomoCLI/FomoCLI/releases",
  };
  const installCode = $("#installCode");
  $$("[data-install]").forEach((b) =>
    b.addEventListener("click", () => {
      $$("[data-install]").forEach((x) => x.classList.toggle("is-active", x === b));
      installCode.textContent = INSTALL[b.dataset.install];
    })
  );
  $("#installCopy").addEventListener("click", () => copy(installCode.textContent));

  /* ════════════ Commands ════════════ */
  const C = (cmd, desc, cost) => ({ cmd, desc, cost });
  const ic = (s) => `<code class="ic">${s}</code>`;
  const COMMANDS = {
    market: [
      C("fomocli lb [24h|7d|30d|all]", `Top traders by PnL. ${ic("--sort volume|trades|followers")}, ${ic("--verified")}, ${ic("-n")}`, "250"),
      C("fomocli tokens [trending|most-held|graduated]", "FOMO token boards: price, 24h, mcap, holders", "250"),
      C("fomocli token &lt;addr&gt; [stats]", "Buy/sell flow over 5m, 1h, 4h and 24h, net flow, top-10 concentration", "250"),
      C("fomocli token &lt;addr&gt; devs", "Deployer and insider positions with their own thesis (rug signal)", "250"),
      C("fomocli token &lt;addr&gt; holders", "Tracked traders holding it (smart money)", "250"),
      C("fomocli token &lt;addr&gt; theses", `What traders wrote about it. ${ic("--sort likes")}, ${ic("--threshold")}, ${ic("--pages")}`, "1,250/page"),
      C("fomocli activity", `Several traders hitting one coin at once. ${ic("--side")}, ${ic("--min-traders")}`, "250"),
      C("fomocli search &lt;query&gt;", `Traders and tokens by name. ${ic("--type")}, ${ic("--tokens")}`, "250"),
      C("fomocli theses", `Latest theses. ${ic("--chain")}, ${ic("--sort equity")}, ${ic("--min-equity")}`, "1,250"),
    ],
    traders: [
      C("fomocli trader &lt;handle&gt;", "Wallets (Solana + EVM), PnL 24h/7d/30d/all, volume, trades, followers, avg hold, clan, account age", "2,500"),
      C("fomocli t &lt;handle&gt; positions", `Open and closed positions, realized/unrealized, win rate. ${ic("--status")}, ${ic("--sort")}, ${ic("--deep")}`, "250/page"),
      C("fomocli t &lt;handle&gt; swaps", "Individual fills", "250"),
      C("fomocli t &lt;handle&gt; balances", `Multi-chain portfolio, per-chain split, allocation bars. ${ic("--chain")}`, "250"),
      C("fomocli t &lt;handle&gt; following|followers", `Their network, each with PnL 24h, volume and trades. ${ic("--sort pnl")}`, "250"),
      C("fomocli t &lt;handle&gt; spotlight", "FOMO's own pick of their best trades and theses", "250"),
      C("fomocli t &lt;handle&gt; theses", `Everything they wrote. ${ic("--sort likes")}`, "1,250"),
      C("fomocli whois &lt;userId&gt;", "Resolve a user ID to a full profile", "2,500"),
      C("fomocli trade &lt;tradeId&gt; [comments]", "One trade and its comment thread", "250"),
    ],
    realtime: [
      C("fomocli live", `Streaming ticker. ${ic("--trader")}, ${ic("--chain")}, ${ic("--token")}, ${ic("--min-usd")}, ${ic("--bell")}, ${ic("--onchain")}`, "0"),
      C("fomocli watch &lt;handle&gt;", "Follow one trader live (copy-trading view)", "0"),
      C("fomocli alerts", `REST snapshot of the feed. ${ic("--type whale")}, ${ic("--since")}`, "125"),
      C("fomocli dash", `Full-screen dashboard. Keys ${ic("1-4")} tabs, ${ic("enter")}, ${ic("w")} window, ${ic("b")} board, ${ic("q")} quit`, "per tab"),
    ],
    alpha: [
      C("fomocli radar", `Swarm radar for coordinated buys or dumps. ${ic("--min-traders")}, ${ic("--window")}, ${ic("--notify")}`, "0"),
      C("fomocli scan &lt;address&gt;", "Rug scanner: one 0-100 risk score, with every reason listed", "750"),
      C("fomocli card &lt;handle&gt;", `A 1200×675 PNG trader card. ${ic("--window 7d")}, ${ic("--send telegram")}`, "2,750"),
      C("fomocli notify setup|test", `Connect Telegram or Discord, then add ${ic("--notify telegram,discord")}`, "free"),
    ],
    setup: [
      C("fomocli auth login|status|logout", `Store your API key (saved with ${ic("0600")} permissions)`, "free"),
      C("fomocli config list|get|set|path", `${ic("cache_ttl")}, ${ic("default_window")}, ${ic("default_chain")}, ${ic("theme")}`, "free"),
      C("fomocli status [--watch]", "API status", "0"),
      C("fomocli credits", "What you have spent and what is left", "free"),
      C("fomocli cache ls|clear|path", "Everything available offline", "free"),
      C("fomocli api &lt;path&gt; -p key=value", "Call any endpoint, get raw JSON", "varies"),
      C("fomocli completion bash|zsh|fish|powershell", "Shell completion", "free"),
    ],
  };
  const panel = $("#cmdPanel");
  const ink = $(".cmd__ink");
  const renderGroup = (g) => {
    panel.innerHTML = COMMANDS[g].map((c, i) => {
      const free = c.cost === "0" || c.cost === "free";
      return `<div class="cmd__row" style="animation-delay:${i * 40}ms">
        <code>${c.cmd}</code><p>${c.desc}</p>
        <span class="cost${free ? " cost--free" : ""}">${c.cost === "0" ? "0 credits" : c.cost}</span>
      </div>`;
    }).join("");
  };
  const moveInk = (btn) => {
    ink.style.width = `${btn.offsetWidth}px`;
    ink.style.height = `${btn.offsetHeight}px`;
    ink.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
  };
  const groupBtns = $$("[data-group]");
  groupBtns.forEach((b) =>
    b.addEventListener("click", () => {
      groupBtns.forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", String(x === b)); });
      moveInk(b);
      renderGroup(b.dataset.group);
      if (animated) ST.refresh();
    })
  );
  renderGroup("market");
  const syncInk = () => moveInk($("[data-group].is-active"));
  window.addEventListener("resize", syncInk);
  document.fonts?.ready.then(syncInk);
  syncInk();

  /* ════════════ Terminal scenes ════════════ */
  const sp = (cls, t) => `<span class="${cls}">${t}</span>`;
  const g = (t) => sp("green", t), r = (t) => sp("red", t), m = (t) => sp("muted", t);
  const st = (t) => sp("steel", t), bo = (t) => sp("t", t), B = (t) => sp("b", t), hd = (t) => sp("hd", t);
  const ok = sp("green", "✓");
  const credit = (c, left) => `  ${m(`${c} credits · ${left} left`)}`;

  const SCENES = {
    lb: {
      cmd: "fomocli --demo lb",
      out: [
        "",
        `${sp("badi", " Leaderboard · 24H ")}  ${m("captured 2m ago")}`,
        "",
        `  ${hd("TRADERS")}    ${hd("COMBINED PNL")}    ${hd("COMBINED VOLUME")}`,
        `  ${bo("6")}          ${g("+$321.5K")}        ${bo("$757.6K")}`,
        "",
        `   ${hd("#  TRADER                         PNL                 VOLUME  TRADES  FOLLOWERS  HOLDS")}`,
        `  ${B("───────────────────────────────────────────────────────────────────────────────────────")}`,
        `   ${sp("gold", "1")}  ${st("@CryptoKaleo")} ${ok} K A L E O  ${g("+$151.4K")}  ${sp("bar", "████████████")}  $119.2K      73        20K      4`,
        `   ${sp("steel", "2")}  ${st("@frankdegods")} ${ok} frank       ${g("+$98.2K")}  ${sp("bar", "███████▊    ")}  $402.3K      51     249.5K     12`,
        `   ${sp("gold", "3")}  ${st("@starcatcher444")} star       ${g("+$45.1K")}  ${sp("bar", "███▌        ")}     $88K     140       3.3K      7`,
        `   4  ${st("@theveeman")} vee             ${g("+$21.9K")}  ${sp("bar", "█▋          ")}     $51K      33        812      3`,
        `   5  ${st("@laifu")}                        ${g("+$8K")}  ${sp("bar", "▋           ")}   $20.1K      19        402      2`,
        `   6  ${st("@ansem")} ${ok}                    ${r("-$3.1K")}  ${sp("bar", "▏           ")}     $77K      12       120K      5`,
        "",
        credit("250", "249,750"),
      ],
    },
    radar: {
      cmd: "fomocli --demo radar --min-traders 3",
      out: [
        "",
        `${sp("badi", " Swarm radar ")}  ${m("live feed · min 3 traders · 0 credits")}`,
        "",
        `  ${B("╭────────────────────────────────────────────────────────────────────────────────────╮")}`,
        `  ${B("│")} ${r("SWARM BUY")}  ${bo("$STONK")}  ${m("solana   09:20:25")}                                               ${B("│")}`,
        `  ${B("│")} ${bo("3 traders")} · 3 buys · ${g("$16.3K")} in 24m                                                 ${B("│")}`,
        `  ${B("│")} ${st("@TEFL0ND0N")} $10.1K · ${st("@IOnlyBuyTekCoins")} $3.2K · ${st("@EvilPanda")} $3K                       ${B("│")}`,
        `  ${B("│")} ${m("6GmAFSYs4gk3FDao5FzzySQpPZaWsa4rUJHacpMpUNgx")}   ${m("check it:")} fomocli scan 6GmAFS…pUNgx ${B("│")}`,
        `  ${B("╰────────────────────────────────────────────────────────────────────────────────────╯")}`,
        "",
        `  ${m("listening…")}`,
      ],
    },
    trader: {
      cmd: "fomocli --demo trader CryptoKaleo",
      out: [
        "",
        `  ${B("╭────────────────────────────────────────╮")}`,
        `  ${B("│")} ${st("@CryptoKaleo")} ${ok}  ${bo("K A L E O")}                ${B("│")}`,
        `  ${B("│")} Ender clan ${m("·")} ${m("360d on FOMO")}               ${B("│")}`,
        `  ${B("╰────────────────────────────────────────╯")}`,
        "",
        `  ${hd("PNL 24H")}    ${hd("PNL 7D")}     ${hd("PNL 30D")}     ${hd("PNL ALL")}`,
        `  ${g("+$8.2K")}     ${g("+$54.1K")}    ${g("+$142.9K")}    ${g("+$151.4K")}`,
        "",
        `  ${hd("VOLUME")}     ${hd("TRADES")}  ${hd("SWAPS")}  ${hd("FOLLOWERS")}  ${hd("FOLLOWING")}  ${hd("AVG HOLD")}`,
        `  ${bo("$119.2K")}    ${bo("73")}      ${bo("184")}    ${bo("20K")}        ${bo("91")}         ${bo("17h 40m")}`,
        "",
        `${sp("badi", " Wallets ")}`,
        "",
        `  ${m("solana")}  ${bo("5AhfPStn66hRYoNNDfJHSDgCH7fBbwMQZUECRrhTo62F")}`,
        `  ${m("evm   ")}  ${bo("0x7b4d16237683fe1765e727eadf99c6f02adf0b59")}`,
        "",
        credit("2,500", "247,500"),
      ],
    },
    live: {
      cmd: "fomocli --demo live",
      out: [
        "",
        `${sp("badi", " Live ")}  ${m("app feed · all chains · 0 credits ·")} ${g("● connected")}`,
        "",
        `  ${m("12:04:01")}  ${st("@frankdegods")}      ${g("BUY ")}    $PONS      ${bo("$40K")}    ${m("robinhood")}  ${sp("badw", " WHALE ")}`,
        `  ${m("12:04:03")}  ${st("@CryptoKaleo")}      ${r("SELL")}    $WIF       ${bo("$6.1K")}   ${m("solana")}`,
        `  ${m("12:04:07")}  ${st("@starcatcher444")}   ${sp("pink", "THESIS")}  $CACHE     ${m('"cache is the next pons, dev is based"')}`,
        `  ${m("12:04:11")}  ${st("@TEFL0ND0N")}        ${g("BUY ")}    $STONK     ${bo("$10.1K")}  ${m("solana")}`,
        `  ${m("12:04:15")}  ${st("@theveeman")}        ${g("BUY ")}    $FARTCOIN  ${bo("$4.4K")}   ${m("solana")}`,
        `  ${m("12:04:18")}  ${st("@laifu")}            ${g("BUY ")}    $PONS      ${bo("$2.2K")}   ${m("robinhood")}`,
        `  ${m("12:04:22")}  ${st("@ansem")}            ${r("SELL")}    $ANSEM     ${bo("$880")}    ${m("solana")}`,
        "",
        `  ${m("streaming… ctrl+c to stop")}`,
      ],
    },
  };

  const term = $("#termBody");
  const termTabs = $$("[data-scene]");
  const order = Object.keys(SCENES);
  const PROMPT = `${g("❯")} ${st("~")} `;
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  let runId = 0;
  let autoplay = true;

  const play = async (name) => {
    const id = ++runId;
    termTabs.forEach((t) => {
      t.classList.toggle("is-active", t.dataset.scene === name);
      t.setAttribute("aria-selected", String(t.dataset.scene === name));
    });
    const scene = SCENES[name];
    if (reduced) { term.innerHTML = PROMPT + scene.cmd + "\n" + scene.out.join("\n"); return; }
    let typed = "";
    term.innerHTML = PROMPT + '<span class="cur"></span>';
    await sleep(350);
    for (const ch of scene.cmd) {
      if (id !== runId) return;
      typed += ch;
      term.innerHTML = PROMPT + typed + '<span class="cur"></span>';
      await sleep(26 + Math.random() * 46);
    }
    await sleep(300);
    let html = PROMPT + typed + "\n";
    for (const line of scene.out) {
      if (id !== runId) return;
      html += line + "\n";
      term.innerHTML = html + '<span class="cur"></span>';
      await sleep(name === "live" ? 360 : 60);
    }
    await sleep(4500);
    if (id !== runId || !autoplay) return;
    play(order[(order.indexOf(name) + 1) % order.length]);
  };
  termTabs.forEach((t) => t.addEventListener("click", () => { autoplay = false; play(t.dataset.scene); }));
  let started = false;
  const tIO = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !started) { started = true; play("lb"); }
  }, { threshold: 0.25 });
  tIO.observe($("#terminal"));

  boot();
})();
