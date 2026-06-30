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

let ALL_PROGRAMS = [];
let CURRENT_STAGE = "secondary";

// ── BOOTSTRAP ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadEverything();
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  const minutes = Number(window.SITE_CONFIG.AUTO_REFRESH_MINUTES || 0);
  if (minutes > 0) {
    setInterval(loadEverything, minutes * 60 * 1000);
  }
});

async function loadEverything() {
  await loadPrograms();
  await loadStats();
}

// ── DATA LOADING ──────────────────────────────────────────────
async function loadPrograms() {
  setStatus("home-status", "loading", "جاري تحميل البرامج...");
  setStatus("stages-status", "loading", "جاري تحميل البرامج...");
  renderSkeleton("home-cards", 3);

  try {
    ALL_PROGRAMS = await SheetsAPI.fetchPrograms();
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
function renderHome() {
  const items = ALL_PROGRAMS.filter(p => p.stage === "all");
  const el = document.getElementById("home-cards");
  if (!items.length) { renderEmpty("home-cards", "لا توجد برامج معلنة لجميع المراحل حالياً"); return; }

  el.innerHTML = items.map((p, idx) => {
    const badge = p.isNew ? badgeHtml("new", "جديد")
      : p.timing === "current" ? badgeHtml("current", "جارٍ الآن")
      : p.timing === "upcoming" ? badgeHtml("coming", "قادم")
      : badgeHtml("past", "سابق");

    return `
      <div class="program-card ${idx === 0 ? "featured" : ""}" onclick="openProgramModal('${p.id}')">
        ${badge}
        <div class="card-title">${escapeHtml(p.title)}</div>
        <div class="card-desc">${escapeHtml(p.description)}</div>
        <div class="card-tags">
          <span class="tag"><i class="ti ${TYPE_ICONS[p.type] || "ti-tag"}" aria-hidden="true"></i> ${TYPE_LABELS[p.type] || p.type}</span>
          <span class="tag"><i class="ti ti-users" aria-hidden="true"></i> جميع المراحل</span>
          ${p.youtubeId ? `<span class="tag video-tag"><i class="ti ti-brand-youtube" aria-hidden="true"></i> فيديو</span>` : ""}
        </div>
        <div class="card-footer">
          <span class="card-date"><i class="ti ti-calendar" aria-hidden="true"></i> ${escapeHtml(p.date)}</span>
          <button class="details-btn">التفاصيل <i class="ti ti-arrow-left" aria-hidden="true"></i></button>
        </div>
      </div>
    `;
  }).join("");
}

function badgeHtml(kind, label) {
  const icons = { new: "ti-sparkles", current: "ti-clock", coming: "ti-hourglass", past: "ti-history" };
  return `<div class="badge badge-${kind}"><i class="ti ${icons[kind]}" aria-hidden="true"></i> ${label}</div>`;
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
  el.innerHTML = list.map(p => `
    <div class="mini-card" onclick="openProgramModal('${p.id}')">
      <div class="mini-top">
        <div class="${ICON_CLASS[p.type] || "mini-icon edu"}"><i class="ti ${p.icon || TYPE_ICONS[p.type] || "ti-book"}" aria-hidden="true"></i></div>
        <span class="tag" style="font-size:10px">${TYPE_LABELS[p.type] || p.type}</span>
      </div>
      <div class="mini-title">${escapeHtml(p.title)}</div>
      <div class="mini-date">
        <i class="ti ti-calendar" aria-hidden="true"></i> ${escapeHtml(p.date)}
        ${p.youtubeId ? `<i class="ti ti-brand-youtube" style="margin-inline-start:5px;color:var(--red-mid)" aria-hidden="true"></i>` : ""}
      </div>
    </div>
  `).join("");
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
    </div>

    ${p.youtubeId ? `
    <div class="modal-section">
      <h4><i class="ti ti-brand-youtube"></i> فيديو تعريفي</h4>
      <div class="video-wrap">
        <iframe src="https://www.youtube.com/embed/${p.youtubeId}" title="${escapeHtml(p.title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>` : ""}

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

    <button class="reg-btn"><i class="ti ti-send"></i> التسجيل في البرنامج</button>
  `;
  document.getElementById("overlay").classList.add("open");
}

function closeModal() {
  document.getElementById("overlay").classList.remove("open");
  // stop any playing video by clearing the iframe src
  const frame = document.querySelector(".video-wrap iframe");
  if (frame) frame.src = frame.src;
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
        <p>افتح تقريرك في Looker Studio ← مشاركة ← تضمين تقرير، ثم الصق الرابط في js/config.js داخل LOOKER_STUDIO_EMBED_URL</p>
        <div class="embed-link"><i class="ti ti-external-link" aria-hidden="true"></i><span>js/config.js</span></div>
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
