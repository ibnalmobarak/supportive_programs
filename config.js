/**
 * ════════════════════════════════════════════════════════════════
 *  إعدادات الربط — عدّل هذا الملف فقط لربط الموقع ببياناتك
 *  CONFIGURATION — this is the only file you need to edit to
 *  connect the site to your own Google Sheet and Looker Studio report.
 *  راجع ملف README.md لشرح خطوة بخطوة.
 * ════════════════════════════════════════════════════════════════
 */

window.SITE_CONFIG = {

  // ── جوجل شيت Google Sheet ─────────────────────────────────────
  // معرّف الشيت: يظهر في رابط الشيت بين /d/ و /edit
  // Example: https://docs.google.com/spreadsheets/d/{THIS_PART}/edit
  GOOGLE_SHEET_ID: "15sVBzrbM5NujxqbyGcODoCTWnSXqsz1wWugrt1gdNhQ",

  // كل تبويب (Sheet tab) له رقم GID يظهر في الرابط بعد gid=
  // Each tab has a GID number visible in the tab's URL after gid=
  SHEETS: {
    // تبويب البرامج: id, title, type, stage, timing, is_new, date, description, conditions, youtube_id
    PROGRAMS_GID: "0",
    // تبويب الإحصائيات: key, value  (اختياري)
    STATS_GID: "1917337504",
  },

  // ── Looker Studio ──────────────────────────────────────────────
  // من تقرير Looker Studio: مشاركة (Share) ← تضمين تقرير (Embed report) ← انسخ الرابط من src
  // From your Looker Studio report: Share → Embed report → copy the src URL
  LOOKER_STUDIO_EMBED_URL: "https://lookerstudio.google.com/embed/reporting/REPORT_ID/page/PAGE_ID",

  // ── إعدادات عامة General ──────────────────────────────────────
  // كل كم دقيقة يُعاد تحميل البيانات تلقائياً من الشيت (0 = تعطيل التحديث التلقائي)
  AUTO_REFRESH_MINUTES: 5,

};