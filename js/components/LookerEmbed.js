/**
 * js/components/LookerEmbed.js
 * Lazily embeds the Looker Studio "grades" report the first time the
 * Grades section is opened — unless the optional Settings tab marks
 * grades as not-ready yet, in which case a "grades being processed"
 * message is shown instead.
 */

import { $id } from "../utils/dom.js";

export class LookerEmbed {
  /** @param {object} config window.SITE_CONFIG-shaped object */
  constructor(config, { wrapId = "looker-embed-wrap" } = {}) {
    this.config = config;
    this.wrapId = wrapId;
    this.initialized = false;
  }

  /** @param {{gradesReady: boolean} | null} settings from SheetsService.fetchSettings() */
  init(settings) {
    if (this.initialized) return;
    const wrap = $id(this.wrapId);
    if (!wrap) return;

    // Settings tab explicitly says grades aren't ready yet.
    if (settings && settings.gradesReady === false) {
      wrap.innerHTML = `
        <div class="embed-area">
          <i class="ti ti-clock-hour-4" aria-hidden="true"></i>
          <h3>جاري تحديث الدرجات</h3>
          <p>نعمل حالياً على تحديث ورصد الدرجات، وستكون متاحة هنا قريباً بإذن الله</p>
        </div>`;
      return;
    }

    const url = this.config.LOOKER_STUDIO_EMBED_URL;

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
    this.initialized = true;
  }
}