/**
 * js/components/RecordingsPaths.js
 * Three-level drill-down component for browsing training path recordings.
 * Hierarchy: Stage → Path → Meetings (with embedded video player + external link).
 *
 * Follows the same class-based pattern as StageTabs.js.
 */

import { $id, escapeHtml } from "../utils/dom.js";
import { RECORDINGS_DATA } from "../data/recordingsData.js";

export class RecordingsPaths {
  constructor() {
    this.data = RECORDINGS_DATA;
    this.currentView = "stages";
    this.selectedStage = null;
    this.selectedPath = null;
    this.selectedMeeting = null;
    this.container = null;
  }

  init() {
    if (!this.container) {
      this.container = $id("recordings-content");
    }
    this.showStages();
  }

  /* ── Rendering ────────────────────────────────────── */

  showStages() {
    this.currentView = "stages";
    this.selectedStage = null;
    this.selectedPath = null;
    this.selectedMeeting = null;
    this.#render();
  }

  showPaths(stageKey) {
    this.selectedStage = this.data.find(s => s.stageKey === stageKey);
    if (!this.selectedStage) return;
    this.currentView = "paths";
    this.selectedPath = null;
    this.selectedMeeting = null;
    this.#render();
  }

  showMeetings(pathIndex) {
    this.selectedPath = this.selectedStage.paths[pathIndex];
    if (!this.selectedPath) return;
    this.currentView = "meetings";
    this.selectedMeeting = null;
    this.#render();
  }

  showPlayer(meetingIndex) {
    this.selectedMeeting = this.selectedPath.meetings[meetingIndex];
    if (!this.selectedMeeting) return;
    this.currentView = "player";
    this.#render();
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
      case "player":
        contentHtml = this.#playerHtml();
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

    if (this.selectedStage && (this.currentView === "paths" || this.currentView === "meetings" || this.currentView === "player")) {
      if (this.currentView === "paths") {
        crumbs.push(`<span class="rec-breadcrumb-current"><i class="ti ${this.selectedStage.stageIcon}"></i> ${escapeHtml(this.selectedStage.stageLabel)}</span>`);
      } else {
        crumbs.push(`<button class="rec-breadcrumb-item" data-nav="paths" data-stage="${this.selectedStage.stageKey}"><i class="ti ${this.selectedStage.stageIcon}"></i> ${escapeHtml(this.selectedStage.stageLabel)}</button>`);
      }
    }

    if (this.selectedPath && (this.currentView === "meetings" || this.currentView === "player")) {
      if (this.currentView === "meetings") {
        crumbs.push(`<span class="rec-breadcrumb-current"><i class="ti ti-route"></i> ${escapeHtml(this.selectedPath.name)}</span>`);
      } else {
        crumbs.push(`<button class="rec-breadcrumb-item" data-nav="meetings"><i class="ti ti-route"></i> ${escapeHtml(this.selectedPath.name)}</button>`);
      }
    }

    if (this.selectedMeeting && this.currentView === "player") {
      crumbs.push(`<span class="rec-breadcrumb-current"><i class="ti ti-player-play"></i> ${escapeHtml(this.selectedMeeting.title)}</span>`);
    }

    return `
      <nav class="rec-breadcrumb fade-in-up" style="animation-delay:0.05s" aria-label="التنقل">
        ${crumbs.join('<i class="ti ti-chevron-left rec-breadcrumb-sep"></i>')}
      </nav>
    `;
  }

  /* ── Stages view ─────────────────────────────────── */

  #stagesHtml() {
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
                <i class="ti ti-player-play"></i> مشاهدة التسجيل
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* ── Player view (embedded video + external link) ── */

  #playerHtml() {
    const embedUrl = this.#toEmbedUrl(this.selectedMeeting.url);
    const originalUrl = this.selectedMeeting.url;

    return `
      <div class="rec-player-wrap fade-in-up" style="animation-delay:0.1s">
        <div class="rec-player-header">
          <div class="rec-player-title">
            <i class="ti ti-player-play"></i>
            ${escapeHtml(this.selectedMeeting.title)} — ${escapeHtml(this.selectedPath.name)}
          </div>
        </div>
        <div class="rec-embed-container">
          <iframe
            src="${embedUrl}"
            allowfullscreen
            allow="autoplay; encrypted-media"
            frameborder="0"
          ></iframe>
        </div>
        <div class="rec-player-footer">
          <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" class="rec-external-link">
            <i class="ti ti-external-link"></i> فتح التسجيل في نافذة جديدة
          </a>
        </div>
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
        else if (nav === "meetings") {
          this.currentView = "meetings";
          this.selectedMeeting = null;
          this.#render();
        }
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

    // Meeting items (click row or watch button)
    this.container.querySelectorAll(".rec-meeting-item").forEach(item => {
      item.addEventListener("click", () => this.showPlayer(Number(item.dataset.meetingIndex)));
    });

    // Watch buttons (prevent double-fire from parent click)
    this.container.querySelectorAll(".rec-watch-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showPlayer(Number(btn.dataset.meetingIndex));
      });
    });
  }

  /* ── Helpers ─────────────────────────────────────── */

  /**
   * Converts a SharePoint sharing link to an embeddable iframe URL.
   * SharePoint personal OneDrive video links can be embedded by replacing
   * the path prefix and adding embed query params.
   */
  #toEmbedUrl(shareUrl) {
    try {
      const url = new URL(shareUrl);
      // Convert personal sharepoint sharing URL to embed format
      // e.g. :v:/g/personal/... → personal/.../embed
      const embedUrl = shareUrl
        .replace(/:v:\/g\//, "")
        .split("?")[0] + "?embed=1&nav=" + (url.searchParams.get("nav") || "");
      return embedUrl;
    } catch {
      // Fallback: just append embed parameter
      return shareUrl + (shareUrl.includes("?") ? "&" : "?") + "embed=1";
    }
  }
}
