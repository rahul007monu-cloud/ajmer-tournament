/* =========================================================
   VK Sports Ajmer — Registration + Payment (Razorpay ready)
   Handles both team & player registration forms.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const VK = window.VK || {};
  const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
  const qs = new URLSearchParams(location.search);

  /* ---------- Populate tournament selects ---------- */
  const tSelects = $$("[data-tournaments]");
  tSelects.forEach((sel) => {
    sel.innerHTML =
      '<option value="">Select a tournament…</option>' +
      (VK.tournaments || [])
        .map((t) => `<option value="${t.id}">${t.name} — ${t.date}</option>`)
        .join("");
    const pre = qs.get("tournament");
    if (pre && (VK.tournaments || []).some((t) => t.id === pre)) sel.value = pre;
  });

  /* ---------- Populate team selects (player page) ---------- */
  $$("[data-teams]").forEach((sel) => {
    sel.innerHTML =
      '<option value="">Select a team…</option>' +
      (VK.teams || []).map((t) => `<option value="${t}">${t}</option>`).join("") +
      '<option value="__free">🆓 I\'m a free agent — assign me a team</option>';
  });

  const form = $("#regForm");
  if (!form) return;
  const mode = form.dataset.mode; // "team" | "player"

  /* ---------- Dynamic player rows (team form) ---------- */
  const playersList = $("#playersList");
  const roles = ["Batter", "Bowler", "All-rounder", "Wicket-keeper"];
  let playerCount = 0;
  const MAX_PLAYERS = 15;

  function playerRow(idx, required) {
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `
      <span class="pnum">${idx}</span>
      <input type="text" placeholder="Player name${required ? " *" : ""}" data-p-name ${required ? "required" : ""}/>
      <select data-p-role>${roles.map((r) => `<option value="${r}">${r}</option>`).join("")}</select>
      <button type="button" class="remove" title="Remove" aria-label="Remove player">×</button>`;
    row.querySelector(".remove").addEventListener("click", () => {
      row.remove();
      renumber();
    });
    return row;
  }
  function renumber() {
    $$(".player-row", playersList).forEach((r, i) => {
      r.querySelector(".pnum").textContent = i + 1;
    });
    playerCount = $$(".player-row", playersList).length;
  }
  const addBtn = $("#addPlayer");
  if (playersList && addBtn) {
    // seed 2 required + 9 default rows worth (start with a captain reminder)
    for (let i = 1; i <= 11; i++) playersList.appendChild(playerRow(i, i <= 2));
    renumber();
    addBtn.addEventListener("click", () => {
      if ($$(".player-row", playersList).length >= MAX_PLAYERS) {
        addBtn.textContent = `Maximum ${MAX_PLAYERS} players reached`;
        return;
      }
      playersList.appendChild(playerRow(playerCount + 1, false));
      renumber();
    });
  }

  /* ---------- Live summary ---------- */
  const tSelect = $("[data-tournaments]");
  const sumRows = $("#summaryRows");
  const sumTotal = $("#summaryTotal");

  function currentTournament() {
    const id = tSelect ? tSelect.value : "";
    return (VK.tournaments || []).find((t) => t.id === id) || null;
  }
  function updateSummary() {
    const t = currentTournament();
    if (!sumRows || !sumTotal) return;
    if (!t) {
      sumRows.innerHTML =
        '<div class="summary-row"><span>Tournament</span><b>—</b></div>' +
        '<div class="summary-row"><span>Entry fee</span><b>—</b></div>';
      sumTotal.textContent = rupee(0);
      return;
    }
    const fee = mode === "team" ? t.teamFee : t.playerFee;
    const platform = Math.round(fee * 0.02); // 2% platform/gateway fee (demo)
    const total = fee + platform;
    sumRows.innerHTML = `
      <div class="summary-row"><span>Tournament</span><b>${t.name}</b></div>
      <div class="summary-row"><span>Date</span><b>${t.date}</b></div>
      <div class="summary-row"><span>${mode === "team" ? "Team entry fee" : "Player entry fee"}</span><b>${rupee(fee)}</b></div>
      <div class="summary-row"><span>Platform &amp; gateway (2%)</span><b>${rupee(platform)}</b></div>`;
    sumTotal.textContent = rupee(total);
    sumTotal.dataset.amount = total;
  }
  if (tSelect) tSelect.addEventListener("change", updateSummary);
  updateSummary();

  /* ---------- Validation ---------- */
  function validate() {
    let ok = true;
    $$(".field", form).forEach((f) => f.classList.remove("invalid"));
    $$("[required]", form).forEach((el) => {
      const val = (el.value || "").trim();
      let bad = !val;
      if (el.type === "email" && val) bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
      if (el.type === "tel" && val) bad = !/^[0-9+\-\s]{10,15}$/.test(val);
      if (bad) {
        ok = false;
        const field = el.closest(".field");
        if (field) field.classList.add("invalid");
      }
    });
    const t = currentTournament();
    if (!t && tSelect) {
      ok = false;
      const field = tSelect.closest(".field");
      if (field) field.classList.add("invalid");
    }
    const consent = $("#consent");
    if (consent && !consent.checked) {
      ok = false;
      consent.closest(".checkbox-line").style.color = "#ff6b6b";
    }
    if (!ok) {
      const firstBad = $(".field.invalid", form);
      if (firstBad) firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return ok;
  }

  /* ---------- Collect payload ---------- */
  function collect() {
    const t = currentTournament();
    const data = { mode, tournament: t ? t.id : "", tournamentName: t ? t.name : "", fields: {} };
    $$("[data-field]", form).forEach((el) => (data.fields[el.dataset.field] = (el.value || "").trim()));
    if (mode === "team" && playersList) {
      data.players = $$(".player-row", playersList)
        .map((r) => ({
          name: (r.querySelector("[data-p-name]").value || "").trim(),
          role: r.querySelector("[data-p-role]").value
        }))
        .filter((p) => p.name);
    }
    data.amount = Number((sumTotal && sumTotal.dataset.amount) || 0);
    return data;
  }

  /* ---------- Payment flow ---------- */
  const submitBtn = $("#submitBtn");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = collect();
    startPayment(payload);
  });

  function loadRazorpay() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function startPayment(payload) {
    const pay = VK.payment || {};
    setLoading(true);

    // DEMO MODE — simulate success (no real charge). Flip demoMode=false in data.js
    if (pay.demoMode || !pay.keyId) {
      setTimeout(() => {
        setLoading(false);
        showSuccess(payload, "DEMO-" + genId());
      }, 1300);
      return;
    }

    const ok = await loadRazorpay();
    if (!ok) {
      setLoading(false);
      alert("Unable to load payment gateway. Please check your connection and try again.");
      return;
    }

    // NOTE: For production, create an order on your backend and pass order_id here.
    let orderId = null;
    if (pay.backendUrl) {
      try {
        const res = await fetch(pay.backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: payload.amount * 100, currency: pay.currency, payload })
        });
        const j = await res.json();
        orderId = j.orderId || j.id || null;
      } catch (err) {
        console.warn("order creation failed", err);
      }
    }

    const options = {
      key: pay.keyId,
      amount: payload.amount * 100, // paise
      currency: pay.currency || "INR",
      name: pay.businessName || "VK Sports Ajmer",
      description: `${payload.mode === "team" ? "Team" : "Player"} entry — ${payload.tournamentName}`,
      image: "https://raw.githubusercontent.com/favicon.svg", // replace with your logo URL
      order_id: orderId || undefined,
      theme: { color: pay.themeColor || "#22c55e" },
      prefill: {
        name: payload.fields.captainName || payload.fields.playerName || "",
        email: payload.fields.email || "",
        contact: payload.fields.phone || ""
      },
      notes: { mode: payload.mode, tournament: payload.tournament },
      handler: function (response) {
        setLoading(false);
        showSuccess(payload, response.razorpay_payment_id || genId());
      },
      modal: { ondismiss: () => setLoading(false) }
    };
    const rz = new window.Razorpay(options);
    rz.on("payment.failed", function () {
      setLoading(false);
      alert("Payment failed or cancelled. Please try again.");
    });
    rz.open();
  }

  function setLoading(v) {
    if (!submitBtn) return;
    submitBtn.disabled = v;
    submitBtn.dataset.label = submitBtn.dataset.label || submitBtn.textContent;
    submitBtn.textContent = v ? "Processing…" : submitBtn.dataset.label;
  }

  function genId() {
    return (
      "VK" +
      Date.now().toString(36).toUpperCase().slice(-5) +
      Math.floor(Math.random() * 900 + 100)
    );
  }

  /* ---------- Success modal ---------- */
  function showSuccess(payload, paymentId) {
    // Persist locally so the organiser can export later (demo convenience)
    try {
      const key = "vk_registrations";
      const all = JSON.parse(localStorage.getItem(key) || "[]");
      all.push({ ...payload, paymentId, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(all));
    } catch (e) {}

    const modal = $("#successModal");
    if (!modal) {
      alert("Registration successful! ID: " + paymentId);
      return;
    }
    $("#modalTitle").textContent =
      payload.mode === "team" ? "Team Registered! 🎉" : "You're In! 🎉";
    $("#modalMsg").textContent =
      payload.mode === "team"
        ? `${payload.fields.teamName || "Your team"} is confirmed for ${payload.tournamentName}.`
        : `${payload.fields.playerName || "You"} are registered for ${payload.tournamentName}.`;
    $("#modalId").textContent = "Ref: " + paymentId;
    modal.classList.add("show");
  }
  const closeBtn = $("#modalClose");
  if (closeBtn) closeBtn.addEventListener("click", () => $("#successModal").classList.remove("show"));
})();
