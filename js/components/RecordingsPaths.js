/**
 * js/components/RecordingsPaths.js
 * Three-level drill-down component for browsing training path recordings.
 * Hierarchy: Stage → Path → Meetings (click "watch" to open the recording
 * directly in a new tab — no in-page embed).
 *
 * Data comes from the Recordings Google Sheet tab (see SheetsService.fetchRecordings),
 * already grouped into Stage → Path → Meetings by the time it reaches init().
 *
 * Follows the same class-based pattern as StageTabs.js.
 */

import { $id, escapeHtml } from "../utils/dom.js";

export class RecordingsPaths {
  /** @param {() => void} [onRetry] called when the user taps "retry" after a load error */
  constructor(onRetry) {
    this.onRetry = onRetry;
    this.data = [];
    this.currentView = "stages";
    this.selectedStage = null;
    this.selectedPath = null;
    this.container = null;
  }

  /** Renders the stage list from freshly-fetched sheet data. */
  init(data) {
    if (!this.container) {
      this.container = $id("recordings-content");
    }
    this.data = data || [];
    this.showStages();
  }

  /** Shown while SheetsService.fetchRecordings() is in flight. */
  showLoading() {
    if (!this.container) this.container = $id("recordings-content");
    this.container.innerHTML = `
      <div class="data-status loading">
        <i class="ti ti-loader-2" aria-hidden="true"></i>
        <span>جاري تحميل التسجيلات من Google Sheets...</span>
      </div>
    `;
  }

  /** Shown when the Recordings tab fails to load (bad GID, sheet not shared, etc.). */
  showError(message) {
    if (!this.container) this.container = $id("recordings-content");
    this.container.innerHTML = `
      <div class="data-status error">
        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
        <span>تعذّر تحميل التسجيلات: ${escapeHtml(message)}</span>
        <button class="retry-btn" id="recordings-retry">إعادة المحاولة</button>
      </div>
    `;
    $id("recordings-retry")?.addEventListener("click", () => this.onRetry && this.onRetry());
  }

  /* ── Rendering ────────────────────────────────────── */

  showStages() {
    this.currentView = "stages";
    this.selectedStage = null;
    this.selectedPath = null;
    this.#render();
  }

  showPaths(stageKey) {
    this.selectedStage = this.data.find(s => s.stageKey === stageKey);
    if (!this.selectedStage) return;
    this.currentView = "paths";
    this.selectedPath = null;
    this.#render();
  }

  showMeetings(pathIndex) {
    this.selectedPath = this.selectedStage.paths[pathIndex];
    if (!this.selectedPath) return;
    this.currentView = "meetings";
    this.#render();
  }

  /** Opens the recording directly in a new tab — no embedded player. */
  watch(meetingIndex) {
    const meeting = this.selectedPath && this.selectedPath.meetings[meetingIndex];
    if (!meeting || !meeting.url) return;
    window.open(meeting.url, "_blank", "noopener,noreferrer");
  }

  /* ── Main render router ──────────────────────────── */

  #render() {
    if (!this.container) return;

    let breadcrumbHtml = this.#breadcrumbHtml();
    let contentHtml = "";

    switch (this.currentView) {
      case "stages":
        contentHtml = this.#stagesHtml();
        break;
      case "paths":
        contentHtml = this.#pathsHtml();
        break;
      case "meetings":
        contentHtml = this.#meetingsHtml();
        break;
    }

    this.container.innerHTML = breadcrumbHtml + contentHtml;
    this.#bindEvents();
  }

  /* ── Breadcrumb ──────────────────────────────────── */

  #breadcrumbHtml() {
    if (this.currentView === "stages") return "";

    const crumbs = [
      `<button class="rec-breadcrumb-item" data-nav="stages"><i class="ti ti-home"></i> المراحل</button>`,
    ];

    if (this.selectedStage) {
      if (this.currentView === "paths") {
        crumbs.push(`<span class="rec-breadcrumb-current"><i class="ti ${this.selectedStage.stageIcon}"></i> ${escapeHtml(this.selectedStage.stageLabel)}</span>`);
      } else {
        crumbs.push(`<button class="rec-breadcrumb-item" data-nav="paths" data-stage="${this.selectedStage.stageKey}"><i class="ti ${this.selectedStage.stageIcon}"></i> ${escapeHtml(this.selectedStage.stageLabel)}</button>`);
      }
    }

    if (this.selectedPath && this.currentView === "meetings") {
      crumbs.push(`<span class="rec-breadcrumb-current"><i class="ti ti-route"></i> ${escapeHtml(this.selectedPath.name)}</span>`);
    }

    return `
      <nav class="rec-breadcrumb fade-in-up" style="animation-delay:0.05s" aria-label="التنقل">
        ${crumbs.join('<i class="ti ti-chevron-left rec-breadcrumb-sep"></i>')}
      </nav>
    `;
  }

  /* ── Stages view ─────────────────────────────────── */

  #stagesHtml() {
    if (!this.data.length) {
      return `<div class="empty-state">لا توجد تسجيلات متاحة حالياً</div>`;
    }
    return `
      <div class="rec-grid">
        ${this.data.map((s, i) => `
          <div class="rec-stage-card fade-in-up" data-stage="${s.stageKey}" style="animation-delay:${0.1 + i * 0.08}s">
            <div class="rec-stage-icon"><i class="ti ${s.stageIcon}"></i></div>
            <div class="rec-stage-info">
              <div class="rec-stage-name">${escapeHtml(s.stageLabel)}</div>
              <div class="rec-stage-count"><i class="ti ti-route"></i> ${s.paths.length} مسار${s.paths.length > 1 ? "ات" : ""}</div>
            </div>
            <i class="ti ti-chevron-left rec-arrow"></i>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* ── Paths view ──────────────────────────────────── */

  #pathsHtml() {
    const paths = this.selectedStage.paths;
    if (!paths.length) {
      return `<div class="empty-state">لا توجد مسارات مسجّلة لهذه المرحلة</div>`;
    }

    return `
      <div class="rec-grid">
        ${paths.map((p, i) => `
          <div class="rec-path-card fade-in-up" data-path-index="${i}" style="animation-delay:${0.1 + i * 0.08}s">
            <div class="rec-path-icon"><i class="ti ti-route"></i></div>
            <div class="rec-path-info">
              <div class="rec-path-name">${escapeHtml(p.name)}</div>
              <div class="rec-path-count"><i class="ti ti-video"></i> ${p.meetings.length} لقاء</div>
            </div>
            <i class="ti ti-chevron-left rec-arrow"></i>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* ── Meetings view ───────────────────────────────── */

  #meetingsHtml() {
    const meetings = this.selectedPath.meetings;
    if (!meetings.length) {
      return `<div class="empty-state">لا توجد لقاءات مسجّلة لهذا المسار</div>`;
    }

    return `
      <div class="rec-meetings-list">
        ${meetings.map((m, i) => `
          <div class="rec-meeting-item fade-in-up" data-meeting-index="${i}" style="animation-delay:${0.1 + i * 0.06}s">
            <div class="rec-meeting-num">${i + 1}</div>
            <div class="rec-meeting-info">
              <div class="rec-meeting-title">${escapeHtml(m.title)}</div>
            </div>
            <div class="rec-meeting-actions">
              <button class="rec-watch-btn" data-meeting-index="${i}">
                <i class="ti ti-player-play"></i> مشاهدة التسجيل <i class="ti ti-external-link" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* ── Event binding ───────────────────────────────── */

  #bindEvents() {
    if (!this.container) return;

    // Breadcrumb nav
    this.container.querySelectorAll(".rec-breadcrumb-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const nav = btn.dataset.nav;
        if (nav === "stages") this.showStages();
        else if (nav === "paths") this.showPaths(btn.dataset.stage);
      });
    });

    // Stage cards
    this.container.querySelectorAll(".rec-stage-card").forEach(card => {
      card.addEventListener("click", () => this.showPaths(card.dataset.stage));
    });

    // Path cards
    this.container.querySelectorAll(".rec-path-card").forEach(card => {
      card.addEventListener("click", () => this.showMeetings(Number(card.dataset.pathIndex)));
    });

    // Meeting items (click row or watch button) — both open the recording directly
    this.container.querySelectorAll(".rec-meeting-item").forEach(item => {
      item.addEventListener("click", () => this.watch(Number(item.dataset.meetingIndex)));
    });

    // Watch buttons (prevent double-fire from parent click)
    this.container.querySelectorAll(".rec-watch-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.watch(Number(btn.dataset.meetingIndex));
      });
    });
  }
}