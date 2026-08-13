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
    // تبويب البرامج: id, title, type, stage, timing, is_new, date, description, conditions, preview_url
    PROGRAMS_GID: "0",
    // تبويب الإحصائيات: key, value  (اختياري)
    STATS_GID: "1917337504",
    // تبويب صور المتصفح (Swiper) في الرئيسية: image_url, title, date, time, points, program_id  (اختياري)
    // إن لم يوجد هذا التبويب، سيعتمد المتصفح تلقائياً على البرامج المعلّمة "جديد" وصورها (preview_url)
    SWIPER_GID: "951759987",
    SETTINGS_GID: "878620133",
    // تبويب تسجيلات المسارات التدريبية: stage, path, title, url  (stage_icon اختياري)
    // - stage: اسم المرحلة كما تريد ظهوره (مثال: "الابتدائية الأولية")
    //   يمكن كتابة أكثر من مرحلة في نفس الخلية مفصولة بشرطة "-"
    //   (مثال: "الثانوية - المتوسطة - الابتدائية العليا") ليظهر نفس التسجيل تحت كل مرحلة منها
    // - path: اسم المسار التدريبي (مثال: "مسار التجويد")
    // - title: عنوان اللقاء (مثال: "اللقاء رقم 1")
    // - url: رابط التسجيل — يفتح مباشرة في نافذة جديدة عند الضغط على "مشاهدة"
    // - stage_icon (اختياري): اسم أيقونة Tabler Icons، مثال ti-star — وإلا تُختار تلقائياً حسب اسم المرحلة
    RECORDINGS_GID: "535021794",
  },

  // ── إعدادات عامة General ──────────────────────────────────────
  // كل كم دقيقة يُعاد تحميل البيانات تلقائياً من الشيت (0 = تعطيل التحديث التلقائي)
  AUTO_REFRESH_MINUTES: 5,

};