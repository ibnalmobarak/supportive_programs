/**
 * js/services/SheetsService.js
 * Fetches data live from the public Google Sheet (CSV export, no API key
 * needed) and maps it into the plain JS objects the rest of the app uses.
 *
 * Required sheet sharing setting: "Anyone with the link" → Viewer.
 */

import { CsvParser } from "./CsvParser.js";
import { PreviewResolver } from "./PreviewResolver.js";

export class SheetsService {
  /** @param {object} config window.SITE_CONFIG-shaped object */
  constructor(config) {
    this.config = config;
  }

  #csvExportUrl(gid) {
    const id = this.config.GOOGLE_SHEET_ID;
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }

  async #fetchTab(gid) {
    const url = this.#csvExportUrl(gid);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} عند جلب بيانات الشيت`);
    const text = await res.text();
    // A private / not-shared sheet redirects to an HTML sign-in page.
    if (/^\s*<!DOCTYPE html/i.test(text) || /accounts\.google\.com/i.test(text)) {
      throw new Error("الشيت غير متاح للقراءة العامة — تأكد من إعداد المشاركة");
    }
    return CsvParser.parse(text);
  }

  /** Adds https:// to bare domains/paths so links always work as absolute URLs. */
  #normalizeUrl(raw) {
    const v = (raw || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  }

  /** Fetches and maps the Programs tab. */
  async fetchPrograms() {
    const rows = await this.#fetchTab(this.config.SHEETS.PROGRAMS_GID);
    return rows.map(r => ({
      id: r.id || r.title,
      title: r.title || "بدون عنوان",
      type: (r.type || "edu").trim(),
      stage: (r.stage || "all").trim(),
      timing: (r.timing || "current").trim(),
      isNew: /^(true|1|yes|نعم)$/i.test(r.is_new || ""),
      date: r.date || "",
      time: (r.time || "").trim(),
      platform: (r.platform || "").trim(),
      description: r.description || "",
      conditions: (r.conditions || "")
        .split(/;|\n/)
        .map(c => c.trim())
        .filter(Boolean),
      participateLink: this.#normalizeUrl(r.participate_link || r.participate || ""),
      notes: (r.notes || "").trim(),
      points: (r.points || "").trim(),
      preview: PreviewResolver.resolve(r.preview_url || ""),
      icon: r.icon || "",
    }));
  }

  /** Fetches and maps the optional Stats tab. Returns null if unavailable. */
  async fetchStats() {
    try {
      const rows = await this.#fetchTab(this.config.SHEETS.STATS_GID);
      const map = {};
      rows.forEach(r => { if (r.key) map[r.key.trim()] = r.value || ""; });
      return map;
    } catch (e) {
      return null; // stats tab is optional
    }
  }

  /**
   * Fetches and maps the optional Swiper tab (home image carousel).
   * `program_id` (optional) links a slide back to a program so tapping it
   * opens that program's modal; otherwise the slide is purely informational.
   * Returns null if the tab isn't configured/reachable.
   */
  async fetchSwiperItems() {
    const gid = this.config.SHEETS.SWIPER_GID;
    if (!gid) return null; // tab not configured — caller should fall back
    try {
      const rows = await this.#fetchTab(gid);
      return rows.map(r => {
        const preview = PreviewResolver.resolve(r.image_url || r.preview_url || "");
        return {
          title: r.title || "",
          date: r.date || "",
          time: (r.time || "").trim(),
          points: (r.points || "").trim(),
          programId: (r.program_id || "").trim(),
          preview,
        };
      }).filter(item => item.preview.imageUrl);
    } catch (e) {
      return null; // optional tab — silently fall back
    }
  }

  /**
   * Fetches the optional Settings tab — a single-row sheet with a
   * `grades_ready` boolean column controlling whether the Grades section
   * shows the live Looker Studio report or an "under processing" message.
   * Returns null if the tab isn't configured/reachable (defaults to showing the report).
   */
  async fetchSettings() {
    const gid = this.config.SHEETS.SETTINGS_GID;
    if (!gid) return null;
    try {
      const rows = await this.#fetchTab(gid);
      if (!rows.length) return null;
      const row = rows[0];
      return {
        gradesReady: /^(true|1|yes|نعم)$/i.test(row.grades_ready || ""),
      };
    } catch (e) {
      return null; // optional tab — silently fall back
    }
  }

  /**
   * Fetches and groups the Recordings tab into Stage → Path → Meetings,
   * the shape RecordingsPaths.js renders directly.
   *
   * Sheet columns: stage, path, title, url (stage_icon optional).
   * A `stage` cell may list several stages separated by "-" (e.g.
   * "الثانوية - المتوسطة"), in which case the same recording is grouped
   * under each of those stages.
   *
   * Returns [] if the tab isn't configured (no RECORDINGS_GID set), so the
   * UI can show an empty state. Throws on real fetch errors (bad GID,
   * sheet not shared, etc.) so the caller can surface a retryable error.
   */
  async fetchRecordings() {
    const gid = this.config.SHEETS.RECORDINGS_GID;
    if (!gid) return [];

    const rows = await this.#fetchTab(gid);
    const stages = new Map(); // stageLabel -> { stageKey, stageLabel, stageIcon, paths: [...] }

    rows.forEach(r => {
      const url = this.#normalizeUrl(r.url || r.link || "");
      const pathName = (r.path || r.track || "بدون مسار").trim();
      const title = (r.title || "بدون عنوان").trim();
      const explicitIcon = (r.stage_icon || "").trim();
      if (!url) return; // a recording without a link is unusable, skip it

      const stageLabels = (r.stage || r.stages || "")
        .split("-")
        .map(s => s.trim())
        .filter(Boolean);
      if (!stageLabels.length) return; // no stage(s) named, nothing to group it under

      stageLabels.forEach(label => {
        if (!stages.has(label)) {
          stages.set(label, {
            stageKey: label,
            stageLabel: label,
            stageIcon: explicitIcon || this.#guessStageIcon(label),
            paths: [],
          });
        }
        const stage = stages.get(label);
        let path = stage.paths.find(p => p.name === pathName);
        if (!path) {
          path = { name: pathName, meetings: [] };
          stage.paths.push(path);
        }
        path.meetings.push({ title, url });
      });
    });

    return Array.from(stages.values());
  }

  /** Best-effort icon guess from a stage label's keywords, used when stage_icon is left blank. */
  #guessStageIcon(label) {
    const l = (label || "").trim();
    if (/أولية/.test(l)) return "ti-star";
    if (/متوسط/.test(l)) return "ti-building";
    if (/ثانوي/.test(l)) return "ti-school";
    if (/عليا|ابتدائي/.test(l)) return "ti-books";
    return "ti-video";
  }
}