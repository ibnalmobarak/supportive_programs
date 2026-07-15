/**
 * app.js — rendering & interaction logic.
 * All program data is loaded live from Google Sheets via sheets.js.
 */

const STAGE_LABELS = {
  secondary: "الثانوية",
  middle: "المتوسطة",
  "upper-primary": "الابتدائية العليا",
  "lower-primary": "الابتدائية الأولية",
  all: "جميع المراحل",
};

const TYPE_LABELS = {
  cultural: "ثقافي",
  tech: "تقني",
  edu: "تعليمي",
  moral: "تربوي",
};

const TYPE_ICONS = {
  cultural: "ti-bulb",
  tech: "ti-device-laptop",
  edu: "ti-book",
  moral: "ti-heart",
};

const ICON_CLASS = { cultural: "mini-icon cultural", tech: "mini-icon tech", edu: "mini-icon edu", moral: "mini-icon moral" };

// Background used for swiper slides that have no YouTube thumbnail to show.
const TYPE_GRADIENTS = {
  cultural: "linear-gradient(135deg, var(--purple-mid), var(--purple-dark))",
  tech: "linear-gradient(135deg, var(--blue-mid), var(--blue-dark))",
  edu: "linear-gradient(135deg, var(--teal-mid), var(--teal-dark))",
  moral: "linear-gradient(135deg, var(--amber-mid), var(--amber-dark))",
};

const TIMING_META = {
  current: { label: "جارٍ الآن", icon: "ti-clock" },
  upcoming: { label: "قادم", icon: "ti-hourglass" },
  past: { label: "سابق", icon: "ti-history" },
};

function platformIcon(platform) {
  const p = (platform || "").toLowerCase();
  if (/google/.test(p)) return "ti-brand-google";
  if (/teams|zoom|meet|video|فيديو/.test(p)) return "ti-video";
  if (/whatsapp|واتس/.test(p)) return "ti-brand-whatsapp";
  if (/حضور|onsite|in.?person|قاعة|ميداني/.test(p)) return "ti-map-pin";
  return "ti-device-desktop";
}

let ALL_PROGRAMS = [];
let SWIPER_ITEMS = null; // from the dedicated Swiper GID tab, if configured
let CURRENT_STAGE = "secondary";

// Home image-swipe carousel state
let SWIPER_INDEX = 0;
let SWIPER_COUNT = 0;
let SWIPER_TIMER = null;
let SWIPER_DRAG = null;
let SWIPER_SUPPRESS_CLICK = false;

// ── BOOTSTRAP ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadEverything();
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeLightbox(); } });

  const minutes = Number(window.SITE_CONFIG.AUTO_REFRESH_MINUTES || 0);
  if (minutes > 0) {
    setInterval(loadEverything, minutes * 60 * 1000);
  }

  // Theme Toggle Logic
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  function updateThemeIcon() {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      themeIcon.className = 'ti ti-sun';
      themeIcon.style.transform = 'rotate(180deg)';
    } else {
      themeIcon.className = 'ti ti-moon';
      themeIcon.style.transform = 'rotate(0deg)';
    }
  }

  if (themeToggle) {
    updateThemeIcon(); // Initial state
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
      updateThemeIcon();
    });
  }
});

async function loadEverything() {
  await loadPrograms();
  await loadStats();
}

// ── DATA LOADING ──────────────────────────────────────────────
async function loadPrograms() {
  setStatus("home-status", "loading", "جاري تحميل البرامج من Google Sheets...");
  setStatus("stages-status", "loading", "جاري تحميل البرامج من Google Sheets...");
  renderSkeleton("home-cards", 3);

  try {
    const [programs, swiperItems] = await Promise.all([
      SheetsAPI.fetchPrograms(),
      SheetsAPI.fetchSwiperItems(),
    ]);
    ALL_PROGRAMS = programs;
    SWIPER_ITEMS = swiperItems; // null if the tab isn't configured/reachable
    setStatus("home-status", "live", "البيانات محدّثة مباشرة من Google Sheets", false, true);
    setStatus("stages-status", "live", "البيانات محدّثة مباشرة من Google Sheets", false, true);
    renderHome();
    renderStages();
  } catch (err) {
    console.error(err);
    setStatus("home-status", "error", `تعذّر تحميل البرامج: ${err.message}`, true);
    setStatus("stages-status", "error", `تعذّر تحميل البرامج: ${err.message}`, true);
    renderEmpty("home-cards", "تعذّر تحميل البرامج حالياً");
  }
}

async function loadStats() {
  const stats = await SheetsAPI.fetchStats();
  if (!stats) return; // optional tab, keep defaults already in the markup
  const map = {
    "stat-avg": stats.avg_grade,
    "stat-students": stats.total_students,
    "stat-programs": stats.registered_programs,
    "stat-participation": stats.participation_rate,
  };
  Object.entries(map).forEach(([id, val]) => {
    if (val) document.getElementById(id).textContent = val;
  });
}

// ── STATUS BANNERS ───────────────────────────────────────────
function setStatus(elId, kind, message, withRetry = false, success) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (success) el.style.display = 'none';
  const icons = { loading: "ti-loader-2", error: "ti-alert-triangle", live: "ti-circle-check" };
  el.className = `data-status ${kind}`;
  el.innerHTML = `
    <i class="ti ${icons[kind]}" aria-hidden="true"></i>
    <span>${message}</span>
    ${withRetry ? `<button class="retry-btn" onclick="loadEverything()">إعادة المحاولة</button>` : ""}
  `;
}

function renderSkeleton(containerId, count) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-line w40" style="height:18px;margin-bottom:14px"></div>
      <div class="skeleton-line w90"></div>
      <div class="skeleton-line w60"></div>
    </div>
  `).join("");
}

function renderEmpty(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="empty-state"><i class="ti ti-inbox" style="font-size:22px;display:block;margin-bottom:8px"></i>${message}</div>`;
}

// ── HOME ──────────────────────────────────────────────────────
// The full-card grid below always shows programs marked is_new = TRUE.
// The swipeable image carousel up top prefers the dedicated Swiper tab
// (SWIPER_GID) when configured; otherwise it falls back to the same
// is_new programs, using their preview_url image when available.
function renderHome() {
  const generalPrograms = ALL_PROGRAMS.filter(p => p.stage == "all");
  const swiperItems = (SWIPER_ITEMS && SWIPER_ITEMS.length)
    ? SWIPER_ITEMS
    : generalPrograms.map(p => ({
        title: p.title,
        date: p.date,
        time: p.time,
        points: p.points,
        programId: p.id,
        preview: p.preview,
        type: p.type,
      }));
  renderHomeSwiper(swiperItems);
  renderHomeGrid(generalPrograms);
}

function renderHomeGrid(items) {
  const el = document.getElementById("home-cards");
  if (!items.length) { renderEmpty("home-cards", "لا توجد برامج جديدة معلنة حالياً"); return; }

  el.innerHTML = items.map((p, idx) => {
    const timing = TIMING_META[p.timing] || TIMING_META.current;
    const isLive = p.timing === "current";

    return `
      <div class="program-card ${idx === 0 ? "featured" : ""} ${isLive ? "is-live" : ""}" style="animation-delay: ${0.1 + (idx * 0.1)}s" onclick="openProgramModal('${escapeHtml(p.id)}')">
        <div class="card-badges">
          ${badgeHtml("new", "جديد")}
          <div class="badge badge-${p.timing === "current" ? "current" : p.timing === "upcoming" ? "coming" : "past"} ${isLive ? "badge-live" : ""}">
            ${isLive ? liveDotHtml() : `<i class="ti ${timing.icon}" aria-hidden="true"></i>`} ${timing.label}
          </div>
        </div>
        <div class="card-title">${escapeHtml(p.title)}</div>
        <div class="card-desc">${escapeHtml(p.description)}</div>
        <div class="card-tags">
          <span class="tag"><i class="ti ${TYPE_ICONS[p.type] || "ti-tag"}" aria-hidden="true"></i> ${TYPE_LABELS[p.type] || p.type}</span>
          ${p.points ? `<span class="tag tag-points"><i class="ti ti-star" aria-hidden="true"></i> ${escapeHtml(p.points)} نقطة</span>` : ""}
          ${p.preview.kind === "youtube" ? `<span class="tag video-tag"><i class="ti ti-brand-youtube" aria-hidden="true"></i> فيديو</span>` : ""}
          ${p.preview.kind === "image" || p.preview.kind === "drive" ? `<span class="tag video-tag"><i class="ti ti-photo" aria-hidden="true"></i> صورة</span>` : ""}
        </div>
        <div class="card-footer">
          <span class="card-date"><i class="ti ti-calendar" aria-hidden="true"></i> ${escapeHtml(p.date)}</span>
          <button class="details-btn">التفاصيل <i class="ti ti-arrow-left" aria-hidden="true"></i></button>
        </div>
      </div>
    `;
  }).join("");
}

// Small pulsing dot used to flag anything currently running/live.
function liveDotHtml() {
  return `<span class="live-dot" aria-hidden="true"></span>`;
}

function badgeHtml(kind, label) {
  const icons = { new: "ti-sparkles", current: "ti-clock", coming: "ti-hourglass", past: "ti-history" };
  return `<div class="badge badge-${kind}"><i class="ti ${icons[kind]}" aria-hidden="true"></i> ${label}</div>`;
}

// ── HOME IMAGE SWIPER ─────────────────────────────────────────
// Touch/drag-friendly carousel. Uses each slide's preview image (YouTube
// thumbnail, Google Drive thumbnail, or direct image URL) when available,
// otherwise a type-colored gradient placeholder.
function renderHomeSwiper(items) {
  const wrap = document.getElementById("home-swiper-wrap");
  const hint = document.getElementById("swiper-hint");
  if (!wrap) return;

  stopAutoplay();
  SWIPER_DRAG = null;
  SWIPER_INDEX = 0;

  if (!items.length) {
    wrap.innerHTML = "";
    wrap.style.display = "none";
    if (hint) hint.style.display = "none";
    return;
  }

  wrap.style.display = "";
  if (hint) hint.style.display = "";

  wrap.innerHTML = `
    <div class="home-swiper" id="home-swiper">
      <div class="swiper-track" id="swiper-track">
        ${items.map(p => swiperSlideHtml(p)).join("")}
      </div>
      ${items.length > 1 ? `
      <button type="button" class="swiper-arrow prev" aria-label="السابق" onclick="swiperStep(-1)"><i class="ti ti-chevron-right" aria-hidden="true"></i></button>
      <button type="button" class="swiper-arrow next" aria-label="التالي" onclick="swiperStep(1)"><i class="ti ti-chevron-left" aria-hidden="true"></i></button>
      <div class="swiper-dots" id="swiper-dots">
        ${items.map((_, i) => `<button type="button" class="swiper-dot ${i === 0 ? "active" : ""}" aria-label="الشريحة ${i + 1}" onclick="swiperGoTo(${i})"></button>`).join("")}
      </div>` : ""}
    </div>
  `;

  SWIPER_COUNT = items.length;
  attachSwiperEvents();
  startAutoplay();
}

function swiperSlideHtml(p) {
  const imageUrl = p.preview && p.preview.imageUrl;
  const bg = imageUrl
    ? `background-image:url('${imageUrl}')`
    : `background:${TYPE_GRADIENTS[p.type] || TYPE_GRADIENTS.edu}`;
  const clickableId = p.programId || "";

  return `
    <div class="swiper-slide" data-id="${escapeHtml(clickableId)}" data-image="${escapeHtml(imageUrl || "")}" style="${bg}">
      <div class="swiper-slide-overlay">
        <span class="badge badge-new"><i class="ti ti-sparkles" aria-hidden="true"></i> جديد</span>
        <div class="swiper-slide-title">${escapeHtml(p.title)}</div>
        <div class="swiper-slide-meta">
          ${p.date ? `<span><i class="ti ti-calendar" aria-hidden="true"></i> ${escapeHtml(p.date)}</span>` : ""}
          ${p.time ? `<span><i class="ti ti-clock" aria-hidden="true"></i> ${escapeHtml(p.time)}</span>` : ""}
          ${p.points ? `<span><i class="ti ti-star" aria-hidden="true"></i> ${escapeHtml(p.points)} نقطة</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function swiperGoTo(i, animate = true) {
  const track = document.getElementById("swiper-track");
  if (!track || !track.children.length) return;
  const count = track.children.length;
  SWIPER_INDEX = ((i % count) + count) % count;
  track.style.transition = animate ? "" : "none";
  track.style.transform = `translateX(${SWIPER_INDEX * 100}%)`;
  document.querySelectorAll("#swiper-dots .swiper-dot").forEach((d, idx) => d.classList.toggle("active", idx === SWIPER_INDEX));
}

function swiperStep(dir) {
  swiperGoTo(SWIPER_INDEX + dir);
  restartAutoplay();
}

function startAutoplay() {
  stopAutoplay();
  if (SWIPER_COUNT <= 1) return;
  SWIPER_TIMER = setInterval(() => swiperGoTo(SWIPER_INDEX + 1), 6000);
}

function stopAutoplay() {
  if (SWIPER_TIMER) { clearInterval(SWIPER_TIMER); SWIPER_TIMER = null; }
}

function restartAutoplay() { startAutoplay(); }

function attachSwiperEvents() {
  const el = document.getElementById("home-swiper");
  const track = document.getElementById("swiper-track");
  if (!el || !track) return;

  const onDown = (clientX, pointerId) => {
    SWIPER_DRAG = { startX: clientX, lastX: clientX, width: el.getBoundingClientRect().width || 1, pointerId };
    track.style.transition = "none";
    stopAutoplay();
  };
  const onMove = (clientX) => {
    if (!SWIPER_DRAG) return;
    SWIPER_DRAG.lastX = clientX;
    const delta = clientX - SWIPER_DRAG.startX;
    track.style.transform = `translateX(calc(${SWIPER_INDEX * 100}% + ${delta}px))`;
  };
  const onUp = () => {
    if (!SWIPER_DRAG) return;
    const delta = SWIPER_DRAG.lastX - SWIPER_DRAG.startX;
    const threshold = SWIPER_DRAG.width * 0.15;
    track.style.transition = "";
    if (delta > threshold) swiperGoTo(SWIPER_INDEX + 1);
    else if (delta < -threshold) swiperGoTo(SWIPER_INDEX - 1);
    else swiperGoTo(SWIPER_INDEX);

    if (Math.abs(delta) > 5) {
      SWIPER_SUPPRESS_CLICK = true;
      setTimeout(() => { SWIPER_SUPPRESS_CLICK = false; }, 60);
    }
    SWIPER_DRAG = null;
    restartAutoplay();
  };

  // Arrows/dots are controls, not drag surfaces — never start a drag from
  // them, or their own onclick handlers get swallowed by pointer capture
  // (this is what broke arrow/dot clicks and the lightbox on desktop mouse).
  const isControl = (target) => !!target.closest(".swiper-arrow, .swiper-dot");

  el.addEventListener("pointerdown", e => {
    if (isControl(e.target)) return;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    onDown(e.clientX, e.pointerId);
  });
  el.addEventListener("pointermove", e => onMove(e.clientX));
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("mouseenter", stopAutoplay);
  el.addEventListener("mouseleave", () => { if (!SWIPER_DRAG) restartAutoplay(); });

  track.addEventListener("click", e => {
    if (SWIPER_SUPPRESS_CLICK) return;
    if (isControl(e.target)) return; // let the arrow/dot's own onclick handle it
    const slide = e.target.closest(".swiper-slide");
    if (!slide) return;
    if (slide.dataset.id) {
      openProgramModal(slide.dataset.id); // slide is linked to a program
    } else if (slide.dataset.image) {
      openLightbox(slide.dataset.image); // unlinked slide — show fullscreen image
    }
  });
}

// ── STAGES ────────────────────────────────────────────────────
function showSection(id, btn) {
  ["home", "stages", "grades"].forEach(s => {
    document.getElementById("sec-" + s).style.display = s === id ? "block" : "none";
  });
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  if (id === "grades") initLookerEmbed();
}

function setStage(stage, btn) {
  CURRENT_STAGE = stage;
  document.querySelectorAll(".stage-tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  renderStages();
}

function renderStages() {
  const items = ALL_PROGRAMS.filter(p => p.stage === CURRENT_STAGE);
  renderMini("current-progs", items.filter(p => p.timing === "current"), "لا توجد برامج جارية حالياً لهذه المرحلة");
  renderMini("upcoming-progs", items.filter(p => p.timing === "upcoming"), "لا توجد برامج قادمة حالياً لهذه المرحلة");
  renderMini("past-progs", items.filter(p => p.timing === "past"), "لا توجد برامج سابقة مسجّلة لهذه المرحلة");
}

function renderMini(containerId, list, emptyMsg) {
  const el = document.getElementById(containerId);
  if (!list.length) { el.innerHTML = `<div class="empty-state">${emptyMsg}</div>`; return; }
  el.innerHTML = list.map((p, idx) => {
    const isLive = p.timing === "current";
    return `
    <div class="mini-card ${isLive ? "is-live" : ""}" style="animation-delay: ${0.1 + (idx * 0.08)}s" onclick="openProgramModal('${escapeHtml(p.id)}')">
      <div class="mini-top">
        <div class="${ICON_CLASS[p.type] || "mini-icon edu"}"><i class="ti ${p.icon || TYPE_ICONS[p.type] || "ti-book"}" aria-hidden="true"></i></div>
        ${isLive ? `<span class="live-tag">${liveDotHtml()} جارٍ الآن</span>` : `<span class="tag" style="font-size:10px">${TYPE_LABELS[p.type] || p.type}</span>`}
      </div>
      <div class="mini-title">${escapeHtml(p.title)}</div>
      <div class="mini-date">
        <i class="ti ti-calendar" aria-hidden="true"></i> ${escapeHtml(p.date)}
        ${p.points ? `<span style="margin-inline-start:6px"><i class="ti ti-star" aria-hidden="true"></i> ${escapeHtml(p.points)}</span>` : ""}
        ${p.preview.kind === "youtube" ? `<i class="ti ti-brand-youtube" style="margin-inline-start:5px;color:var(--red-mid)" aria-hidden="true"></i>` : ""}
        ${(p.preview.kind === "image" || p.preview.kind === "drive") ? `<i class="ti ti-photo" style="margin-inline-start:5px;color:var(--gray-hint)" aria-hidden="true"></i>` : ""}
      </div>
    </div>
  `;
  }).join("");
}

// Renders the modal's preview block (video embed or image) based on the
// resolved preview_url kind: "youtube" | "drive" | "image" | "" (none).
function previewHtml(p) {
  const preview = p.preview;
  if (!preview || !preview.kind) return "";

  if (preview.kind === "youtube") {
    return `
    <div class="modal-section">
      <h4><i class="ti ti-brand-youtube"></i> فيديو تعريفي</h4>
      <div class="video-wrap">
        <iframe src="https://www.youtube.com/embed/${preview.id}" title="${escapeHtml(p.title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>`;
  }

  // drive or plain image — both render as a static image
  return `
    <div class="modal-image">
      <img src="${escapeHtml(preview.imageUrl)}" alt="${escapeHtml(p.title)}" loading="lazy">
    </div>`;
}

// ── MODAL ─────────────────────────────────────────────────────
function openProgramModal(id) {
  const p = ALL_PROGRAMS.find(x => x.id === id);
  if (!p) return;


  document.getElementById("modal-title").textContent = p.title;
  document.getElementById("modal-body").innerHTML = `
    <div class="modal-badges">
      <span class="badge badge-new">${TYPE_LABELS[p.type] || p.type}</span>
      <span class="badge badge-current"><i class="ti ti-users" style="font-size:11px"></i> ${STAGE_LABELS[p.stage] || p.stage}</span>
      <span class="badge badge-coming"><i class="ti ti-calendar" style="font-size:11px"></i> ${escapeHtml(p.date)}</span>
      ${p.time ? `<span class="badge badge-time"><i class="ti ti-clock" style="font-size:11px"></i> ${escapeHtml(p.time)}</span>` : ""}
      ${p.platform ? `<span class="badge badge-platform"><i class="ti ${platformIcon(p.platform)}" style="font-size:11px"></i> ${escapeHtml(p.platform)}</span>` : ""}
      ${p.points ? `<span class="badge badge-points"><i class="ti ti-star" style="font-size:11px"></i> ${escapeHtml(p.points)} نقطة</span>` : ""}
    </div>
  
  ${previewHtml(p)}

    <div class="modal-section">
      <h4><i class="ti ti-info-circle"></i> شرح البرنامج</h4>
      <p>${escapeHtml(p.description) || "سيتم إضافة الوصف قريباً."}</p>
    </div>

    ${p.conditions.length ? `
    <div class="modal-section">
      <h4><i class="ti ti-list-check"></i> شروط الاشتراك</h4>
      <ul class="cond-list">
        ${p.conditions.map(c => `<li><span class="cond-dot"></span>${escapeHtml(c)}</li>`).join("")}
      </ul>
    </div>` : ""}

    ${p.notes ? `
    <div class="modal-section">
      <h4><i class="ti ti-notes"></i> معلومات أخرى</h4>
      <p>${escapeHtml(p.notes)}</p>
    </div>` : ""}

    ${p.participateLink ? `
    <a class="reg-btn" href="${escapeHtml(p.participateLink)}" target="_blank" rel="noopener noreferrer">
      <i class="ti ti-send"></i> ${(p.participateLink.includes('drive.google') ? 'معاينة مرفقات البرنامج' : 'المشاركة في البرنامج')}
    </a>` : `
    <button class="reg-btn" disabled>
      <i class="ti ti-link-off"></i> رابط المشاركة غير متاح حالياً
    </button>`}
  `;
  document.getElementById("overlay").classList.add("open");
}

function closeModal() {
  document.getElementById("overlay").classList.remove("open");
  // stop any playing video by clearing the iframe src
  const frame = document.querySelector(".video-wrap iframe");
  if (frame) frame.src = frame.src;
}

// ── LIGHTBOX (fullscreen swiper image) ────────────────────────
// Used for swiper slides that aren't linked to a program (no program_id):
// tapping the image shows it fullscreen instead of doing nothing.
function openLightbox(imageUrl) {
  if (!imageUrl) return;
  stopAutoplay();
  document.getElementById("lightbox-img").src = imageUrl;
  document.getElementById("lightbox-overlay").classList.add("open");
}

function closeLightbox() {
  const overlay = document.getElementById("lightbox-overlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.getElementById("lightbox-img").src = "";
  restartAutoplay();
}

// ── LOOKER STUDIO (GRADES) ───────────────────────────────────
let lookerInitialized = false;
function initLookerEmbed() {
  if (lookerInitialized) return;
  const wrap = document.getElementById("looker-embed-wrap");
  const url = window.SITE_CONFIG.LOOKER_STUDIO_EMBED_URL;

  if (!url || url.includes("REPORT_ID")) {
    wrap.innerHTML = `
      <div class="embed-area">
        <i class="ti ti-brand-google" aria-hidden="true"></i>
        <h3>لم يتم ربط تقرير Looker Studio بعد</h3>
        <p>افتح تقريرك في Looker Studio ← مشاركة ← تضمين تقرير، ثم الصق الرابط في config.js داخل LOOKER_STUDIO_EMBED_URL</p>
        <div class="embed-link"><i class="ti ti-external-link" aria-hidden="true"></i><span>config.js</span></div>
      </div>`;
    return;
  }

  wrap.innerHTML = `<iframe src="${url}" frameborder="0" style="border:0" allowfullscreen loading="lazy" title="تقرير الدرجات"></iframe>`;
  lookerInitialized = true;
}

// ── UTIL ──────────────────────────────────────────────────────
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}