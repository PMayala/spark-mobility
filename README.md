# Spark Mobility — Website

A multi-page, production-grade website for **Spark Mobility** (Spark Systems Rwanda Ltd) — Kigali's 100% electric ride-hailing network. Plain HTML/CSS/JS + one Vercel serverless function. No frameworks, no build step.

## Pages
`index` Home · `terms` + `privacy` (full legal text, Jan 7 2025). Drivers page has two structured application forms (car-owner · free, and moto-rider · drive-to-own) with photo upload; home has an animated app mockup. · `ride` Riders · `drivers` Programs, earnings calculator & live application · `fleet` Vehicle classes · `safety` · `impact` · `about` · `contact` (live form + map) · `404` · `offline`

## Run locally
- **Full experience (forms + API):** `npm i -g vercel` once, then `vercel dev` in this folder → http://localhost:3000
- **Quick preview:** open `index.html`, or VS Code *Live Server*, or `npx serve .`
  (Without the API the forms gracefully fall back to opening the visitor's email app and say so.)

## Deploy to Vercel
`vercel` → accept defaults → `vercel --prod`. Or drag the folder into vercel.com/new.
`vercel.json` sets clean URLs, immutable asset caching, SW no-cache, and security headers. `/api/lead.js` deploys automatically as a serverless function.

## Forms & backend (working out of the box)
All three flows — **contact**, **driver application**, **newsletter** — POST JSON to `/api/lead`, which validates, honeypot-filters bots, rate-limits (20/hr/IP) and **logs every lead** to the function logs (Vercel → Deployments → Functions), so nothing is lost even before email is configured.

To also receive leads by email, add env vars in Vercel → Settings → Environment Variables:
| Var | Value |
|---|---|
| `RESEND_API_KEY` | API key from resend.com (free tier fine) |
| `LEAD_TO` | inbox that receives leads, e.g. `hello@sparkmobility.rw` |
| `LEAD_FROM` | *(optional)* verified sender, e.g. `Spark Website <no-reply@yourdomain>` |

Frontend states: loading spinner → success panel (aria-live) → inline server-side error messages → offline/mailto fallback.

## PWA
Installable app: `manifest.webmanifest` + icons + `sw.js` (network-first pages with `offline.html` fallback; stale-while-revalidate same-origin assets; API and cross-origin media never cached). Registered on https/localhost only.

## Languages (English / Français / Kinyarwanda)
A functional 3-language switch (with flag icons) lives in the header and hamburger (persisted in localStorage, sets `<html lang>`, updates the active pill). It translates the **full page content** — headings, body copy, cards, forms, CTAs, footer and dynamically-swapped fleet-tab values — not just the chrome.

- Translations live in `assets/js/i18n.js`: `SPARK_T` (visible text, keyed by the exact English string → `[fr, rw]`), `SPARK_HTML` (multi-node headings), `SPARK_PH` (input placeholders) and `SPARK_MSG` (JS-generated success messages).
- The engine in `main.js` snapshots each element's English into `data-en`, then swaps by exact-match lookup; legal pages carry `data-no-i18n` and stay in English by design (with an on-page note).
- To extend coverage, add `"English string": ["Français", "Kinyarwanda"]` rows to `SPARK_T` — any exact match is picked up automatically.
- **French** is fluent; **Kinyarwanda** is written plainly and should be reviewed by a native speaker before launch.

## Facts synced with official sources
Lease package RWF 7,500/day incl. brand-new smartphone, free registration, uniforms & helmets, full insurance and training (spark.taxi) · Support +250 796 698 668 · privacy@spark.rw · KG 123 St, Kigali · approved drivers start within 48h · Terms & Privacy pages carry the company's provided legal text.

## Real app links (verified)
- Rider app (Android): https://play.google.com/store/apps/details?id=com.spark.userapp
- Driver app (Android): https://play.google.com/store/apps/details?id=com.spark.driverapp
- Driver app (iOS): https://apps.apple.com/app/id6755871143
- Rider iOS listing wasn't published at build time — the App Store button links to the official https://spark.taxi until it ships (swap the href in the CTA when live).

## Before real launch — checklist
- [ ] Set the env vars above; send a test lead from /contact.
- [ ] Replace placeholder domain `https://spark-mobility.vercel.app` in `sitemap.xml`, `robots.txt`, canonicals & JSON-LD with the real domain (`spark.taxi`).
- [ ] Replace placeholder emails (`hello@` / `drivers@` / `security@sparkmobility.rw`).
- [ ] The three testimonials are **illustrative placeholders** — replace with real, permissioned quotes (portraits are stock).
- [ ] Swap stock media for owned fleet/team photography when available (all current media is license-safe; credits below & in the footer).
- [ ] Optional: add Vercel Analytics.

## Media credits & licenses (all free for commercial use)
Wikimedia Commons (CC BY / CC BY-SA): Emmanuel Kwizera, Anton Crone, Jenny Paul, Zenith4237, Adrien K, Cyr, Giseletuy, Dave Proffer & contributors · Unsplash photographers (Unsplash License) · Pexels videos: Taryn Elliott, Gustavo Fring & creators of clips 19832249/5321794 (Pexels License) · Map embeds © OpenStreetMap contributors (attribution on-page). Media is hot-linked from source CDNs; licenses permit self-hosting under `assets/` if preferred.

## Structure
```
*.html                     pages (shared header/footer, aria-current nav)
api/lead.js                serverless: validate → log → optional Resend email
assets/css/main.css        design system + responsive refinement layer
assets/js/main.js          menu · reveals · counters · tabs · FAQ · calculator · live forms · SW
sw.js · offline.html · manifest.webmanifest · .well-known/security.txt
vercel.json · robots.txt · sitemap.xml
```
