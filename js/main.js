/* =========================================================
   VK Sports Ajmer — Site interactions
   Nav, reveals, counters, dynamic content, loader.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky nav ---------- */
  const nav = $("#nav");
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = $("#navToggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    $$(".nav-links a", nav).forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), (i % 4) * 90);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$(".stat-num");
  if (counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const target = parseFloat(el.dataset.count || "0");
          const suffix = el.dataset.suffix || "";
          const dur = 1600;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.floor(eased * target);
            el.textContent = val.toLocaleString("en-IN") + (p === 1 ? suffix : "");
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Inject tournaments ---------- */
  const grid = $("#tournamentGrid");
  if (grid && window.VK && window.VK.tournaments) {
    grid.innerHTML = window.VK.tournaments
      .map(
        (t) => `
      <article class="t-card reveal" style="--card-accent:${hexToRgba(t.accent, 0.18)}">
        <div class="t-top">
          <span class="t-tag" style="color:${t.accent};border-color:${hexToRgba(t.accent,0.4)}">${t.tag}</span>
          <div class="t-prize"><small>Prize Pool</small><b>${t.prize}</b></div>
        </div>
        <h3 class="t-name">${t.name}</h3>
        <div class="t-format">${t.format}</div>
        <div class="t-meta">
          <div><span>Venue</span>${t.venue}</div>
          <div><span>Date</span>${t.date}</div>
          <div><span>Format</span>${t.overs}</div>
          <div><span>Slots</span>${t.slots}</div>
        </div>
        <div class="t-actions">
          <a href="register-team.html?tournament=${t.id}" class="btn btn-primary btn-block">Register Team</a>
          <a href="register-player.html?tournament=${t.id}" class="btn btn-outline">Player</a>
        </div>
        <div class="t-fee">Team entry ₹${t.teamFee.toLocaleString("en-IN")} • Player entry ₹${t.playerFee.toLocaleString("en-IN")}</div>
      </article>`
      )
      .join("");
    // re-observe newly added reveals
    $$(".t-card.reveal", grid).forEach((el, i) => {
      const io = new IntersectionObserver(
        (ents) => ents.forEach((e) => e.isIntersecting && (el.classList.add("in"), io.unobserve(el))),
        { threshold: 0.1 }
      );
      io.observe(el);
    });
  }

  /* ---------- Inject gallery ---------- */
  const ggrid = $("#galleryGrid");
  if (ggrid && window.VK && window.VK.gallery) {
    ggrid.innerHTML = window.VK.gallery
      .map(
        (g) => `<div class="g-tile reveal"><span class="g-icon">${g.icon}</span><span class="g-label">${g.label}</span></div>`
      )
      .join("");
    $$(".g-tile.reveal", ggrid).forEach((el) => {
      const io = new IntersectionObserver(
        (ents) => ents.forEach((e) => e.isIntersecting && (el.classList.add("in"), io.unobserve(el))),
        { threshold: 0.1 }
      );
      io.observe(el);
    });
  }

  /* ---------- Hero title GSAP intro (after loader) ---------- */
  window.VK = window.VK || {};
  window.VK.playHeroIntro = function () {
    if (!window.gsap) return;
    gsap.from(".hero-badge", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out" });
    gsap.from(".hero-title .line", { y: 60, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power4.out", delay: 0.1 });
    gsap.from(".hero-sub", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.4 });
    gsap.from(".hero-cta .btn", { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.6 });
    gsap.from(".hero-scroll", { opacity: 0, duration: 1, delay: 1.1 });
  };

  /* ---------- helpers ---------- */
  function hexToRgba(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
})();
