/**
 * Spark Mobility — lead endpoint (Vercel serverless, zero dependencies)
 * Handles: contact messages, driver applications, newsletter signups.
 *
 * Behaviour:
 *  - Validates + sanitises input, blocks bots via honeypot, rate-limits per IP.
 *  - Always logs the lead (visible in Vercel → Deployment → Functions logs),
 *    so no submission is ever lost even before email is configured.
 *  - If RESEND_API_KEY + LEAD_TO env vars are set, also delivers by email
 *    via Resend (https://resend.com — free tier is fine). See README.md.
 */
const RATE = new Map(); // best-effort per-instance rate limit

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const clean = (v, n) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, n);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  // Honeypot — bots fill hidden fields; pretend success, deliver nothing.
  if (clean(b.company, 50)) { res.status(200).json({ ok: true, delivered: false }); return; }

  const type    = clean(b.type, 20) || "contact";          // contact | driver | newsletter
  const name    = clean(b.name, 120);
  const email   = clean(b.email, 160).toLowerCase();
  const phone   = clean(b.phone, 40);
  const message = String(b.message == null ? "" : b.message).trim().slice(0, 4000);
  const extra   = {
    program: clean(b.program, 60),
    licence: clean(b.licence, 30),
    topic:   clean(b.topic, 60),
  };

  // Per-type validation
  if (type === "newsletter") {
    if (!EMAIL_RE.test(email)) { res.status(400).json({ ok: false, error: "Please enter a valid email address." }); return; }
  } else if (type === "driver") {
    if (name.length < 2)  { res.status(400).json({ ok: false, error: "Please tell us your name." }); return; }
    if (phone.replace(/\D/g, "").length < 7) { res.status(400).json({ ok: false, error: "Please enter a valid phone number." }); return; }
  } else {
    if (name.length < 2)  { res.status(400).json({ ok: false, error: "Please tell us your name." }); return; }
    if (!EMAIL_RE.test(email)) { res.status(400).json({ ok: false, error: "Please enter a valid email address." }); return; }
    if (message.length < 5) { res.status(400).json({ ok: false, error: "Please write a short message." }); return; }
  }

  // Rate limit: 20 requests / hour / IP (best-effort per warm instance)
  const ip = (String(req.headers["x-forwarded-for"] || "").split(",")[0] ||
              (req.socket && req.socket.remoteAddress) || "unknown").trim();
  const now = Date.now();
  const hits = (RATE.get(ip) || []).filter((t) => now - t < 36e5);
  if (hits.length >= 20) { res.status(429).json({ ok: false, error: "Too many requests — please try again later." }); return; }
  hits.push(now); RATE.set(ip, hits);

  const lead = { ts: new Date().toISOString(), type, name, email, phone, ...extra, message, ip };
  console.log("[spark-lead]", JSON.stringify(lead)); // always persisted in function logs

  // Optional email delivery via Resend
  let delivered = false;
  const KEY = process.env.RESEND_API_KEY, TO = process.env.LEAD_TO;
  if (KEY && TO) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.LEAD_FROM || "Spark Website <onboarding@resend.dev>",
          to: [TO],
          reply_to: EMAIL_RE.test(email) ? email : undefined,
          subject: `[Spark · ${type}] ${name || email || phone}`,
          text: Object.entries(lead).map(([k, v]) => `${k}: ${v}`).join("\n"),
        }),
      });
      delivered = r.ok;
      if (!r.ok) console.error("[spark-lead] resend", r.status, await r.text().catch(() => ""));
    } catch (e) { console.error("[spark-lead] resend error", e.message); }
  }

  res.status(200).json({ ok: true, delivered });
};
