/**
 * sheets.js
 * Fetches data live from the public Google Sheet (CSV export, no API key
 * needed) and parses it into plain JS objects the rest of the app uses.
 *
 * Required sheet sharing setting: "Anyone with the link" → Viewer.
 */

const SheetsAPI = (() => {

  function csvExportUrl(gid) {
    const id = window.SITE_CONFIG.GOOGLE_SHEET_ID;
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }

  // Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes,
  // commas and newlines inside quotes.
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (c === '"' && next === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ""; }
        else if (c === '\r') { /* ignore */ }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }

    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1)
      .filter(r => r.some(cell => cell.trim() !== ""))
      .map(r => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = (r[idx] ?? "").trim(); });
        return obj;
      });
  }

  // Accepts a bare YouTube video ID OR a full YouTube URL and returns the ID.
  function extractYoutubeId(raw) {
    if (!raw) return "";
    const v = raw.trim();
    if (!v) return "";
    if (/^[\w-]{11}$/.test(v)) return v; // already a bare ID
    const patterns = [
      /(?:youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    ];
    for (const p of patterns) {
      const m = v.match(p);
      if (m) return m[1];
    }
    return "";
  }

  async function fetchTab(gid) {
    const url = csvExportUrl(gid);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} عند جلب بيانات الشيت`);
    const text = await res.text();
    // A private / not-shared sheet redirects to an HTML sign-in page.
    if (/^\s*<!DOCTYPE html/i.test(text) || /accounts\.google\.com/i.test(text)) {
      throw new Error("الشيت غير متاح للقراءة العامة — تأكد من إعداد المشاركة");
    }
    return parseCSV(text);
  }

  async function fetchPrograms() {
    const rows = await fetchTab(window.SITE_CONFIG.SHEETS.PROGRAMS_GID);
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
      participateLink: normalizeUrl(r.participate_link || r.participate || ""),
      notes: (r.notes || "").trim(),
      points: (r.points || "").trim(),
      youtubeId: extractYoutubeId(r.youtube_id || r.youtube_url || ""),
      icon: r.icon || "",
    }));
  }

  // Adds https:// to bare domains/paths so links always work as absolute URLs.
  function normalizeUrl(raw) {
    const v = (raw || "").trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  }

  async function fetchStats() {
    try {
      const rows = await fetchTab(window.SITE_CONFIG.SHEETS.STATS_GID);
      const map = {};
      rows.forEach(r => { if (r.key) map[r.key.trim()] = r.value || ""; });
      return map;
    } catch (e) {
      return null; // stats tab is optional
    }
  }

  return { fetchPrograms, fetchStats, extractYoutubeId };
})();