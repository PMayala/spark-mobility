/* Spark Mobility — shared behaviour (vanilla, zero dependencies) */
(function () {
"use strict";


/* ---------------- Sticky nav ---------------- */
var hd = document.querySelector("header.top");
if (hd) addEventListener("scroll", function () { hd.classList.toggle("on", scrollY > 10); }, { passive: true });

/* ---------------- Mobile menu (burger v2) ---------------- */
var mbtn = document.getElementById("mbtn"), mpanel = document.getElementById("mpanel");
function setMenu(open) {
  if (!mbtn || !mpanel) return;
  mbtn.classList.toggle("open", open);
  mpanel.classList.toggle("open", open);
  mbtn.setAttribute("aria-expanded", String(open));
  mbtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mpanel.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("menu-open", open);
  if (open) { var f = mpanel.querySelector("a"); if (f) f.focus({ preventScroll: true }); }
}
if (mbtn && mpanel) {
  mbtn.addEventListener("click", function () { setMenu(!mpanel.classList.contains("open")); });
  mpanel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && mpanel.classList.contains("open")) { setMenu(false); mbtn.focus(); } });
  addEventListener("resize", function () { if (innerWidth > 1000) setMenu(false); }, { passive: true });
}

/* ---------------- Reveal on scroll ---------------- */
var io = new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll(".rv").forEach(function (el) {
  var d = el.getAttribute("data-d"); if (d) el.style.transitionDelay = d * 90 + "ms";
  io.observe(el);
});

/* ---------------- Count-up numbers ---------------- */
var co = new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    if (!e.isIntersecting) return; co.unobserve(e.target);
    var el = e.target, end = +el.getAttribute("data-count"), t0 = performance.now(), D = 1300;
    (function f(t) {
      var p = Math.min(1, (t - t0) / D), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString(); if (p < 1) requestAnimationFrame(f);
    })(t0);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach(function (el) { co.observe(el); });

/* ---------------- Videos: play only when visible ---------------- */
var vio = new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    var v = e.target;
    if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    else v.pause();
  });
}, { threshold: 0.2 });
document.querySelectorAll("video[data-auto]").forEach(function (v) { vio.observe(v); });

/* ---------------- Generic tab groups ---------------- */
document.querySelectorAll("[data-tabs]").forEach(function (group) {
  var tabs = [].slice.call(group.querySelectorAll("[data-v]"));
  var scope = document.querySelector(group.getAttribute("data-tabs")) || document;
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var i = +t.getAttribute("data-v");
      tabs.forEach(function (x) { var on = x === t; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
      scope.querySelectorAll("[data-tabimg]").forEach(function (im, j) { im.classList.toggle("show", j === i); });
      var data = window.__tabdata && window.__tabdata[group.id];
      if (data && data[i]) Object.keys(data[i]).forEach(function (k) {
        var n = scope.querySelector('[data-f="' + k + '"]');
        if (n) { delete n.dataset.en; n.textContent = data[i][k]; }
      });
      // keep dynamically-swapped values translated
      if (window.__lang && window.__lang !== "en" && window.__applyLang)
        window.__applyLang(window.__lang, scope.nodeType ? scope : document.body);
    });
  });
});

/* ---------------- FAQ: close siblings ---------------- */
document.querySelectorAll(".faq").forEach(function (d) {
  d.addEventListener("toggle", function () {
    if (d.open) d.parentElement.querySelectorAll(".faq[open]").forEach(function (o) { if (o !== d) o.open = false; });
  });
});

/* ---------------- Earnings calculator ---------------- */
if (document.getElementById("cPlan")) {
  // fee = daily lease/partner fee, days = paid days/week, and sensible defaults per plan
  var plans = {
    moto:  { fee: 7500,  days: 6, trips: 16, fare: 1500, tripMin: 6,  tripMax: 34, fareMin: 600,  fareMax: 3500 },
    sedan: { fee: 30000, days: 6, trips: 12, fare: 5000, tripMin: 5,  tripMax: 24, fareMin: 2000, fareMax: 12000 },
    cross: { fee: 40000, days: 6, trips: 12, fare: 6000, tripMin: 5,  tripMax: 24, fareMin: 2500, fareMax: 14000 },
    own:   { fee: 1000,  days: 7, trips: 14, fare: 2500, tripMin: 6,  tripMax: 30, fareMin: 800,  fareMax: 8000 }
  };
  var $p = document.getElementById("cPlan"), $t = document.getElementById("cTrips"), $f = document.getElementById("cFare"),
      $oT = document.getElementById("oTrips"), $oF = document.getElementById("oFare"),
      $g = document.getElementById("rGross"), $l = document.getElementById("rLease"), $d = document.getElementById("rDay"),
      $w = document.getElementById("rWeek"), $m = document.getElementById("rMonth"), $pk = document.getElementById("rPeak");
  var fmt = function (n) { return "RWF " + Math.max(0, Math.round(n)).toLocaleString(); };
  var calc = function () {
    var p = plans[$p.value], trips = +$t.value, fare = +$f.value;
    var gross = trips * fare, net = gross - p.fee, week = net * p.days;
    $oT.textContent = trips; $oF.textContent = fare.toLocaleString();
    $g.textContent = fmt(gross); $l.textContent = "− " + fmt(p.fee);
    $d.textContent = fmt(net); $w.textContent = fmt(week); $m.textContent = fmt(week * 4.33);
    // colour the net red-free: if it ever goes negative, show a gentle hint instead of a scary 0
    $d.style.color = net <= 0 ? "var(--mut)" : "";
    if ($pk) $pk.style.display = gross >= 25000 ? "block" : "none";
  };
  // when the plan changes, reset the sliders to that vehicle's realistic range + defaults
  var applyPlan = function () {
    var p = plans[$p.value];
    $t.min = p.tripMin; $t.max = p.tripMax; $t.value = p.trips;
    $f.min = p.fareMin; $f.max = p.fareMax; $f.step = p.fareMax > 8000 ? 250 : 100; $f.value = p.fare;
    calc();
  };
  $p.addEventListener("change", applyPlan);
  [$t, $f].forEach(function (el) { el.addEventListener("input", calc); });
  applyPlan();
}

/* ---------------- File upload feedback ---------------- */
document.querySelectorAll(".filegrid input[type=file]").forEach(function (inp) {
  inp.addEventListener("change", function () {
    var wrap = inp.closest(".filegrid"), small = wrap && wrap.querySelector("small"), b = wrap && wrap.querySelector("b");
    if (!wrap) return;
    var n = inp.files ? inp.files.length : 0;
    if (n > 0) {
      wrap.classList.add("has");
      if (b) b.textContent = n === 1 ? "1 photo selected" : n + " photos selected";
      if (small) small.textContent = "Tap to change your selection";
    } else {
      wrap.classList.remove("has");
      if (b) b.textContent = "Add clear photos";
      if (small) small.textContent = "PNG or JPG · you can upload multiple";
    }
  });
});

/* ---------------- Live forms → /api/lead (mailto fallback offline) ---------------- */
function msg(key, fallback) {
  var lang = window.__lang || "en", m = (window.SPARK_MSG || {})[key];
  if (!m) return fallback;
  var i = lang === "fr" ? 1 : lang === "rw" ? 2 : 0;
  return m[i] || m[0] || fallback;
}
function doneTemplate(type) {
  var h = type === "driver" ? msg("appRecvH", "Application received") : msg("msgSentH", "Message sent");
  var p = type === "driver"
    ? msg("appRecvP", "Thank you — our driver team will call you back, usually within one working day.")
    : msg("msgSentP", "Thank you — we reply within one working day. For anything urgent, call +250 796 698 668.");
  return '<div class="form-done"><span class="dic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg></span><h3>' + h + "</h3><p>" + p + "</p></div>";
}
function payload(f, type) {
  var o = { type: type };
  f.querySelectorAll("input,select,textarea").forEach(function (i) { if (i.name) o[i.name.toLowerCase()] = i.value; });
  return o;
}
function mailtoFallback(f, status) {
  var to = f.getAttribute("data-mailto"), subj = f.getAttribute("data-subject") || "Website enquiry", body = "";
  f.querySelectorAll("input,select,textarea").forEach(function (i) { if (i.name && i.name !== "company") body += i.name + ": " + i.value + "\n"; });
  location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
  status.hidden = false; status.classList.add("ok");
  status.textContent = "No backend detected in this preview — we opened your email app with the message instead.";
}
document.querySelectorAll('form[data-api="driver"],form[data-api="contact"]').forEach(function (f) {
  f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var type = f.getAttribute("data-api");
    var btn = f.querySelector('button[type="submit"]');
    var status = f.querySelector(".form-status");
    if (!status) { status = document.createElement("p"); status.className = "form-status"; f.appendChild(status); }
    status.hidden = true; status.classList.remove("ok");
    if (!btn.querySelector(".spin")) btn.insertAdjacentHTML("beforeend", '<span class="spin" aria-hidden="true"></span>');
    btn.classList.add("is-loading"); btn.setAttribute("aria-busy", "true");
    fetch("/api/lead", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(f, type))
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        btn.classList.remove("is-loading"); btn.removeAttribute("aria-busy");
        if (res.ok && res.j && res.j.ok) {
          f.setAttribute("aria-live", "polite");
          f.innerHTML = doneTemplate(type);
        } else {
          status.hidden = false;
          status.textContent = (res.j && res.j.error) || "Something went wrong — please try again.";
        }
      })
      .catch(function () { btn.classList.remove("is-loading"); btn.removeAttribute("aria-busy"); mailtoFallback(f, status); });
  });
});
/* Newsletter */
document.querySelectorAll('form[data-api="newsletter"]').forEach(function (f) {
  f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var input = f.querySelector('input[name="email"]'), btn = f.querySelector("button");
    if (!input.value || input.value.indexOf("@") < 1) { input.focus(); return; }
    btn.disabled = true; btn.textContent = "…";
    fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "newsletter", email: input.value }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { f.classList.add("done"); f.innerHTML = msg("newsOk", "You're on the list ✓"); }
        else { btn.disabled = false; btn.textContent = "Subscribe"; input.focus(); }
      })
      .catch(function () { f.classList.add("done"); f.innerHTML = "Saved for launch ✓ (offline preview)"; });
  });
});

/* ---------------- Service worker (PWA) ---------------- */
if (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  var mlnk = document.createElement("link"); mlnk.rel = "manifest"; mlnk.href = "/manifest.webmanifest";
  document.head.appendChild(mlnk);
  if ("serviceWorker" in navigator)
    addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
}

/* ---------------- Scroll progress (JS fallback) + back to top ---------------- */
var pg = document.querySelector(".pgbar"), toTop = document.getElementById("toTop");
var pgNative = CSS && CSS.supports && CSS.supports("animation-timeline: scroll()");
function onScrollUI() {
  var max = document.documentElement.scrollHeight - innerHeight;
  if (pg && !pgNative) pg.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
  if (toTop) toTop.classList.toggle("show", scrollY > 640);
}
addEventListener("scroll", onScrollUI, { passive: true }); onScrollUI();
if (toTop) toTop.addEventListener("click", function () { scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });

/* ---------------- i18n: EN / Français / Kinyarwanda (full content) ----------------
   Dictionaries live in i18n.js: SPARK_T (text), SPARK_HTML (headings),
   SPARK_PH (placeholders), SPARK_MSG (JS messages). Index 0 = fr, 1 = rw.
   Strategy: on first switch away from EN, snapshot each element's English text
   into data-en; translate by exact-match lookup; restore from data-en for EN. */
var IDX = { fr: 0, rw: 1 };
var chromeKeys = { // keyed chrome bits that repeat/need stability
  ride:"Ride", drivers:"Drivers", fleet:"Fleet", safety:"Safety", impact:"Impact",
  about:"About", contact:"Contact", getapp:"Get the app", becomedriver:"Become a driver",
  support:"Support", emergency:"Emergency", fride:"Ride", fdrive:"Drive",
  fcompany:"Company", subscribe:"Subscribe", emailph:"Email address"
};
var T  = window.SPARK_T  || {};
var TH = window.SPARK_HTML || {};
var PH = window.SPARK_PH || {};

function trans(en, lang) { // English string -> target, or null
  if (lang === "en") return null;
  var row = T[en]; if (!row) return null;
  var v = row[IDX[lang]]; return (v && v.length) ? v : null;
}

// Leaf elements whose single text node we translate directly.
var LEAF = "h1,h2,h3,h4,p,q,summary,label,option,small,b,em,span,div,button,a,li,th,td,figcaption,strong";

function applyLang(lang, root) {
  root = root || document.body;
  var scoped = root !== document.body;

  // 1) keyed chrome (data-i18n) — stable, keeps nav/menu/footer aligned
  root.querySelectorAll("[data-i18n]").forEach(function (el) {
    var k = el.getAttribute("data-i18n"), en = chromeKeys[k];
    if (!en) return;
    if (lang === "en") { el.textContent = en; return; }
    var row = T[en]; if (row && row[IDX[lang]]) el.textContent = row[IDX[lang]];
  });

  // 2) innerHTML headings (data-i18n-html)
  root.querySelectorAll("[data-i18n-html]").forEach(function (el) {
    var k = el.getAttribute("data-i18n-html"), m = TH[k]; if (!m) return;
    el.innerHTML = m[lang] || m.en;
  });

  // 3) placeholders (data-i18n-ph keyed + generic by English text)
  root.querySelectorAll("input[placeholder],textarea[placeholder]").forEach(function (el) {
    if (!el.dataset.enPh) el.dataset.enPh = el.getAttribute("placeholder") || "";
    var en = el.dataset.enPh;
    if (lang === "en") { if (en) el.setAttribute("placeholder", en); return; }
    var row = PH[en]; if (row && row[IDX[lang]]) el.setAttribute("placeholder", row[IDX[lang]]);
  });

  // 4) general visible text — leaf elements only, skip chrome/no-translate zones
  root.querySelectorAll(LEAF).forEach(function (el) {
    if (el.hasAttribute("data-i18n") || el.hasAttribute("data-i18n-html")) return;
    if (el.closest("[data-no-i18n],.legal,script,style,code,pre")) return;
    // only elements whose content is a single text node (leaf), to avoid clobbering children
    if (el.children.length !== 0) return;
    var raw = el.textContent; if (!raw) return;
    var en = el.dataset.en != null ? el.dataset.en : raw.trim();
    if (!en) return;
    if (lang === "en") { if (el.dataset.en != null) el.textContent = el.dataset.en; return; }
    var t = trans(en, lang);
    if (t) { if (el.dataset.en == null) el.dataset.en = en; el.textContent = t; }
  });

  if (!scoped) {
    try { localStorage.setItem("spark-lang", lang); } catch (e) {}
    document.documentElement.setAttribute("lang", lang);
    // cache flag markup per language from the menu once
    if (!window.__flags) {
      window.__flags = {};
      document.querySelectorAll(".lmenu button[data-lang]").forEach(function (b) {
        var f = b.querySelector(".flag"); if (f) window.__flags[b.getAttribute("data-lang")] = f.outerHTML;
      });
    }
    document.querySelectorAll(".lmenu button[data-lang]").forEach(function (b) {
      var l = b.getAttribute("data-lang");
      b.classList.toggle("on", l === lang);
      b.setAttribute("aria-selected", String(l === lang));
    });
    var codes = { en: "EN", fr: "FR", rw: "RW" };
    document.querySelectorAll(".lswitch .lcurrent").forEach(function (cur) {
      var f = cur.querySelector(".flag"), code = cur.querySelector(".lcode");
      if (f && window.__flags[lang]) f.outerHTML = window.__flags[lang];
      if (code) code.textContent = codes[lang] || "EN";
    });
    window.__lang = lang;
  }
}
window.__applyLang = applyLang;

/* Language dropdown: open/close + select */
document.querySelectorAll(".lswitch").forEach(function (sw) {
  var cur = sw.querySelector(".lcurrent");
  if (cur) {
    cur.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = sw.classList.toggle("open");
      cur.setAttribute("aria-expanded", String(open));
    });
  }
  sw.querySelectorAll(".lmenu button[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () {
      applyLang(b.getAttribute("data-lang"));
      sw.classList.remove("open");
      if (cur) cur.setAttribute("aria-expanded", "false");
    });
  });
});
addEventListener("click", function () {
  document.querySelectorAll(".lswitch.open").forEach(function (sw) {
    sw.classList.remove("open");
    var c = sw.querySelector(".lcurrent"); if (c) c.setAttribute("aria-expanded", "false");
  });
});
addEventListener("keydown", function (e) {
  if (e.key === "Escape") document.querySelectorAll(".lswitch.open").forEach(function (sw) { sw.classList.remove("open"); });
});
(function () {
  var saved = "en";
  try { saved = localStorage.getItem("spark-lang") || "en"; } catch (e) {}
  window.__lang = saved;
  applyLang(saved); // always sync the current-flag display
})();

/* ---------------- Year ---------------- */
document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
