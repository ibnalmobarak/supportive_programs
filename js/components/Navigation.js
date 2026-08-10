/**
 * js/components/Navigation.js
 * Controls the top nav bar's section switching (Home / Stages / Grades).
 */

import { $all } from "../utils/dom.js";

const SECTIONS = ["home", "stages", "grades", "recordings"];

export class Navigation {
  /**
   * @param {(sectionId: string) => void} [onShowSection] extra hook, e.g. lazy-load Looker on "grades"
   */
  constructor(onShowSection) {
    this.onShowSection = onShowSection;
    this.#bind();
  }

  #bind() {
    $all(".nav-btn[data-section]").forEach(btn => {
      btn.addEventListener("click", () => this.show(btn.dataset.section, btn));
    });
  }

  show(id, btn) {
    SECTIONS.forEach(s => {
      const el = document.getElementById("sec-" + s);
      if (el) el.style.display = s === id ? "block" : "none";
    });
    $all(".nav-btn[data-section]").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    this.onShowSection && this.onShowSection(id);
  }
}
