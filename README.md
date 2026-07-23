# VK Sports Ajmer 🏏 — Cinematic Cricket Tournament Website

A premium, 3D-animated website for local cricket tournaments in Ajmer. Visitors are greeted by a rotating, floodlit cricket stadium rendered in real-time 3D, then scroll through tournament details, legacy stats and a gallery. Teams and individual players can register and pay their entry fee online (Razorpay-ready).

## ✨ Features

- **Cinematic 3D hero** — auto-rotating night cricket stadium built with [Three.js](https://threejs.org/): green field with mowing stripes, pitch + stumps, tiered stands, animated crowd, 4 flickering floodlight towers and a starfield. The camera dives in as you scroll.
- **Landing sections** — About, animated legacy counters, upcoming tournaments, "how to join", gallery and contact/footer with scroll reveal animations (GSAP + IntersectionObserver).
- **Team registration** (`register-team.html`) — team + captain details and a dynamic squad builder (2–15 players).
- **Player registration** (`register-player.html`) — individual entry with team selection (or "free agent"), playing role, batting/bowling style and experience.
- **Live entry summary** with fee breakdown that updates when a tournament is chosen.
- **Razorpay-ready payment flow** — runs in demo mode out of the box; add your key to go live.
- **Fully responsive** and dependency-light (only CDN scripts, no build step).

## 📁 Structure

```
vk-sports-ajmer/
├── index.html            # Landing page (3D hero + all sections)
├── register-team.html    # Team registration
├── register-player.html  # Player registration
├── css/style.css         # Full cinematic theme
└── js/
    ├── data.js           # Tournaments, teams, gallery + PAYMENT CONFIG
    ├── main.js           # Nav, reveals, counters, content injection
    ├── stadium.js        # Three.js 3D stadium scene
    └── register.js       # Form logic + Razorpay payment
```

## 🚀 Run locally

No build step. Because the 3D scene uses ES modules, serve it over HTTP (not `file://`):

```bash
cd vk-sports-ajmer
python3 -m http.server 8080
# open http://localhost:8080
```

An internet connection is required in the browser so the CDN libraries (Three.js, GSAP) load. If they can't load, the hero gracefully falls back to a gradient.

## 💳 Enable real payments (Razorpay)

1. Open `js/data.js` and edit the `window.VK.payment` block:
   ```js
   window.VK.payment = {
     keyId: "rzp_live_XXXXXXXXXXXX",   // your Razorpay Key ID
     backendUrl: "https://api.yoursite.com/create-order", // optional but recommended
     demoMode: false                    // turn OFF demo mode
   };
   ```
2. **Recommended:** create the order on a backend (never expose your Key Secret in the browser). Your `backendUrl` should accept `{ amount, currency, payload }`, create a Razorpay order, and return `{ orderId }`. The frontend passes that `order_id` to Checkout and Razorpay verifies the signature.
3. Verify the payment signature on your backend in the webhook/callback before marking a registration as paid.

While `demoMode` is `true` (or no `keyId` is set), the site simulates a successful payment so you can demo the full flow without charging anyone. Registrations are also saved to the browser's `localStorage` under `vk_registrations` for demo convenience.

## 🌐 Deploy

Any static host works — Netlify, Vercel, Cloudflare Pages, GitHub Pages, or your own domain/hosting. Just upload the folder contents. Point your domain (e.g. `vksportsajmer.in`) at it and you're live.

## 🎨 Customise

- **Tournaments / fees / teams:** edit the arrays in `js/data.js`.
- **Brand colours:** edit the CSS variables at the top of `css/style.css` (`--green`, `--gold`, etc.).
- **Contact details / socials:** edit the footer in each HTML file.
- **Logo:** replace the 🏏 emoji marks and the Razorpay `image` URL in `js/register.js`.
