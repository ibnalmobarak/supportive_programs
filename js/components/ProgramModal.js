/**
 * js/components/ProgramModal.js
 * Renders and controls the program-detail modal dialog.
 */

import { $id, escapeHtml, formatText } from "../utils/dom.js";
import { STAGE_LABELS, TYPE_LABELS, platformIcon } from "../utils/constants.js";

export class ProgramModal {
  constructor({ overlayId = "overlay", titleId = "modal-title", bodyId = "modal-body" } = {}) {
    this.overlayId = overlayId;
    this.titleId = titleId;
    this.bodyId = bodyId;
    this.#bindCloseControls();
  }

  #bindCloseControls() {
    const overlay = $id(this.overlayId);
    if (!overlay) return;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) this.close(); });
    overlay.querySelector(".modal-close")?.addEventListener("click", () => this.close());
  }

  open(p) {
    if (!p) return;

    $id(this.titleId).textContent = p.title;
    $id(this.bodyId).innerHTML = `
      <div class="modal-badges">
        <span class="badge badge-new">${TYPE_LABELS[p.type] || p.type}</span>
        <span class="badge badge-current"><i class="ti ti-users" style="font-size:11px"></i> ${STAGE_LABELS[p.stage] || p.stage}</span>
        <span class="badge badge-coming"><i class="ti ti-calendar" style="font-size:11px"></i> ${escapeHtml(p.date)}</span>
        ${p.time ? `<span class="badge badge-time"><i class="ti ti-clock" style="font-size:11px"></i> ${escapeHtml(p.time)}</span>` : ""}
        ${p.platform ? `<span class="badge badge-platform"><i class="ti ${platformIcon(p.platform)}" style="font-size:11px"></i> ${escapeHtml(p.platform)}</span>` : ""}
        ${p.points ? `<span class="badge badge-points"><i class="ti ti-star" style="font-size:11px"></i> ${escapeHtml(p.points)} نقطة</span>` : ""}
      </div>

    ${this.#previewHtml(p)}

      <div class="modal-section">
        <h4><i class="ti ti-info-circle"></i> شرح البرنامج</h4>
        <p>${formatText(p.description) || "سيتم إضافة الوصف قريباً."}</p>
      </div>

      ${p.conditions.length ? `
      <div class="modal-section">
        <h4><i class="ti ti-list-check"></i> شروط الاشتراك</h4>
        <ul class="cond-list">
          ${p.conditions.map(c => `<li><span class="cond-dot"></span>${formatText(c)}</li>`).join("")}
        </ul>
      </div>` : ""}

      ${p.notes ? `
      <div class="modal-section">
        <h4><i class="ti ti-notes"></i> معلومات أخرى</h4>
        <p>${formatText(p.notes)}</p>
      </div>` : ""}

      ${p.participateLink ? `
      <a class="reg-btn" href="${escapeHtml(p.participateLink)}" target="_blank" rel="noopener noreferrer">
        <i class="ti ti-send"></i> ${(p.participateLink.includes('drive.google') ? 'معاينة مرفقات البرنامج' : 'المشاركة في البرنامج')}
      </a>` : `
      <button class="reg-btn" disabled>
        <i class="ti ti-link-off"></i> رابط المشاركة غير متاح حالياً
      </button>`}
    `;
    $id(this.overlayId).classList.add("open");
  }

  close() {
    $id(this.overlayId).classList.remove("open");
    // stop any playing video / Drive preview by clearing the iframe src
    const videoFrame = document.querySelector(".video-wrap iframe");
    if (videoFrame) videoFrame.src = videoFrame.src;
    const driveFrame = document.querySelector(".drive-preview-wrap iframe");
    if (driveFrame) driveFrame.src = "";
  }

  // Renders the modal's preview block based on the resolved preview_url kind:
  //   "youtube" → embedded YouTube player
  //   "drive"   → Google Drive /preview iframe (works for PDFs, images, docs, etc.)
  //   "image"   → static <img> tag
  #previewHtml(p) {
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

    // Google Drive file — use the universal /preview iframe
    // Works for PDFs, images, documents, presentations, etc.
    if (preview.kind === "drive") {
      return `
      <div class="modal-section">
        <h4><i class="ti ti-file-description"></i> معاينة الملف</h4>
        <div class="drive-preview-wrap">
          <iframe src="https://drive.google.com/file/d/${preview.id}/preview" title="${escapeHtml(p.title)}"
            allow="autoplay" loading="lazy"></iframe>
        </div>
        <a class="drive-external-link" href="https://drive.google.com/file/d/${preview.id}/view" target="_blank" rel="noopener noreferrer">
          <i class="ti ti-external-link"></i> فتح الملف في نافذة جديدة
        </a>
      </div>`;
    }

    // plain image URL — render as a static image
    return `
      <div class="modal-image">
        <img src="${escapeHtml(preview.imageUrl)}" alt="${escapeHtml(p.title)}" loading="lazy">
      </div>`;
  }
}

