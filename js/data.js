/* =========================================================
   VK Sports Ajmer — Shared Data
   Central place for tournaments, teams and pricing.
   Edit these arrays to update the whole site.
   ========================================================= */

window.VK = window.VK || {};

// ---- Upcoming tournaments ----
window.VK.tournaments = [
  {
    id: "ajmer-premier-league-2026",
    name: "Ajmer Premier League 2026",
    format: "Tennis Ball • Day & Night",
    venue: "Patel Stadium, Ajmer",
    date: "15 Aug 2026",
    overs: "8 Overs a side",
    prize: "₹1,51,000",
    teamFee: 3100,
    playerFee: 250,
    slots: "24 Teams",
    tag: "Flagship",
    accent: "#22c55e"
  },
  {
    id: "monsoon-cup-2026",
    name: "Monsoon Knockout Cup",
    format: "Leather Ball • Knockout",
    venue: "Mayo College Ground",
    date: "5 Sep 2026",
    overs: "10 Overs a side",
    prize: "₹75,000",
    teamFee: 2100,
    playerFee: 200,
    slots: "16 Teams",
    tag: "Knockout",
    accent: "#38bdf8"
  },
  {
    id: "corporate-smash-2026",
    name: "Corporate Smash Series",
    format: "Tennis Ball • League",
    venue: "Ana Sagar Sports Complex",
    date: "20 Sep 2026",
    overs: "6 Overs a side",
    prize: "₹51,000",
    teamFee: 2500,
    playerFee: 250,
    slots: "12 Teams",
    tag: "Corporate",
    accent: "#f59e0b"
  },
  {
    id: "diwali-dhamaka-2026",
    name: "Diwali Dhamaka T10",
    format: "Tennis Ball • Floodlit",
    venue: "Patel Stadium, Ajmer",
    date: "25 Oct 2026",
    overs: "10 Overs a side",
    prize: "₹2,11,000",
    teamFee: 4100,
    playerFee: 300,
    slots: "32 Teams",
    tag: "Mega Event",
    accent: "#e879f9"
  }
];

// ---- Registered teams (players can choose to join these) ----
window.VK.teams = [
  "Ajmer Royals",
  "Dargah Warriors",
  "Ana Sagar Titans",
  "Pushkar Panthers",
  "Nasirabad Knights",
  "Beawar Blasters",
  "Kishangarh Kings",
  "Foy Sagar Falcons",
  "Taragarh Tigers",
  "Adarsh Nagar Avengers",
  "Vaishali Vipers",
  "Civil Lines Chargers"
];

// ---- Gallery moments (emoji-driven cinematic tiles) ----
window.VK.gallery = [
  { icon: "🏏", label: "Last-over thriller" },
  { icon: "🏆", label: "Champions 2025" },
  { icon: "🔥", label: "Floodlit finals" },
  { icon: "🎯", label: "Hat-trick hero" },
  { icon: "💥", label: "Maximum!" },
  { icon: "🥎", label: "Perfect toss" },
  { icon: "🎉", label: "Victory lap" },
  { icon: "⚡", label: "Super over" }
];

/* =========================================================
   PAYMENT CONFIG (Razorpay ready)
   ---------------------------------------------------------
   Replace the key below with your live/test Razorpay Key ID.
   Backend order creation endpoint can be set in BACKEND_URL.
   Leave as-is to run in DEMO mode (no real charge).
   ========================================================= */
window.VK.payment = {
  provider: "razorpay",
  keyId: "",                 // e.g. "rzp_live_xxxxxxxxxxxxx"
  backendUrl: "",            // e.g. "https://api.yoursite.com/create-order"
  currency: "INR",
  businessName: "VK Sports Ajmer",
  themeColor: "#22c55e",
  demoMode: true             // true => simulated success (no real payment)
};
