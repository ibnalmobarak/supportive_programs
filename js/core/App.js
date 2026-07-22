/**
 * js/core/App.js
 * Top-level orchestrator: wires the data services, shared state, and UI
 * components together, and owns the load/refresh lifecycle. This is the
 * only file that knows about all the pieces — components stay decoupled
 * from each other and only talk through App's callbacks.
 */

import { SheetsService } from "../services/SheetsService.js";
import { AppState } from "../state/AppState.js";
import { StatusBanner } from "../components/StatusBanner.js";
import { ProgramCards } from "../components/ProgramCards.js";
import { HomeSwiper } from "../components/HomeSwiper.js";
import { StageTabs } from "../components/StageTabs.js";
import { ProgramModal } from "../components/ProgramModal.js";
import { Lightbox } from "../components/Lightbox.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { Navigation } from "../components/Navigation.js";
import { LookerEmbed } from "../components/LookerEmbed.js";
import { $id } from "../utils/dom.js";

export class App {
  constructor(config) {
    this.config = config;
    this.sheets = new SheetsService(config);
    this.state = new AppState();

    this.homeStatus = new StatusBanner("home-status");
    this.stagesStatus = new StatusBanner("stages-status");

    this.modal = new ProgramModal();
    this.lightbox = new Lightbox({
      onOpen: () => this.swiper.stopAutoplay(),
      onClose: () => this.swiper.restartAutoplay(),
    });

    this.cards = new ProgramCards((id) =>
      this.modal.open(this.state.findProgramById(id)),
    );

    this.swiper = new HomeSwiper({
      wrapId: "home-swiper-wrap",
      hintId: "swiper-hint",
      onOpenProgram: (id) => this.modal.open(this.state.findProgramById(id)),
      onOpenImage: (imageUrl) => this.lightbox.open(imageUrl),
    });

    this.stageTabs = new StageTabs({
      onOpenProgram: (id) => this.modal.open(this.state.findProgramById(id)),
      onStageChange: (stage) => {
        this.state.setStage(stage);
        this.stageTabs.render(this.state.programs, this.state.currentStage);
      },
    });

    this.looker = new LookerEmbed(config);
    this.nav = new Navigation(async (sectionId) => {
  if (sectionId === "grades") {
    const settings = await this.sheets.fetchSettings();
    this.looker.init(settings);
  }
});
    this.theme = new ThemeToggle();
  }

  async start() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.modal.close();
        this.lightbox.close();
      }
    });

    const minutes = Number(this.config.AUTO_REFRESH_MINUTES || 0);
    if (minutes > 0) {
      setInterval(() => this.loadEverything(), minutes * 60 * 1000);
    }

    await this.loadEverything();
  }

  async loadEverything() {
    await this.loadPrograms();
    await this.loadStats();
  }

  async loadPrograms() {
    this.homeStatus.set("loading", "جاري تحميل البرامج من Google Sheets...");
    this.stagesStatus.set("loading", "جاري تحميل البرامج من Google Sheets...");
    this.cards.renderSkeleton(3);

    try {
      const [programs, swiperItems] = await Promise.all([
        this.sheets.fetchPrograms(),
        this.sheets.fetchSwiperItems(),
      ]);
      this.state.setPrograms(programs);
      this.state.setSwiperItems(swiperItems); // null if the tab isn't configured/reachable
      this.homeStatus.set(
        "live",
        "البيانات محدّثة مباشرة من Google Sheets",
        false,
        true,
      );
      this.stagesStatus.set(
        "live",
        "البيانات محدّثة مباشرة من Google Sheets",
        false,
        true,
      );
      this.renderHome();
      this.stageTabs.render(this.state.programs, this.state.currentStage);
    } catch (err) {
      console.error(err);
      this.homeStatus.set("error", `تعذّر تحميل البرامج: ${err.message}`, true);
      this.stagesStatus.set(
        "error",
        `تعذّر تحميل البرامج: ${err.message}`,
        true,
      );
      this.cards.renderEmpty("تعذّر تحميل البرامج حالياً");
    }
  }

  async loadStats() {
    const stats = await this.sheets.fetchStats();
    if (!stats) return; // optional tab, keep defaults already in the markup
    const map = {
      "stat-avg": stats.avg_grade,
      "stat-students": stats.total_students,
      "stat-programs": stats.registered_programs,
      "stat-participation": stats.participation_rate,
    };
    Object.entries(map).forEach(([id, val]) => {
      if (val) {
        const el = $id(id);
        if (el) el.textContent = val;
      }
    });
  }

  // The full-card grid always shows programs marked is_new = TRUE (stage "all").
  // The swipeable image carousel up top prefers the dedicated Swiper tab
  // (SWIPER_GID) when configured; otherwise it falls back to the same
  // is_new programs, using their preview_url image when available.
  renderHome() {
    const generalPrograms = this.state.programs.filter(
      (p) => p.stage === "all",
    );
    const swiperItems =
      this.state.swiperItems && this.state.swiperItems.length
        ? this.state.swiperItems
        : generalPrograms.map((p) => ({
            title: p.title,
            date: p.date,
            time: p.time,
            points: p.points,
            programId: p.id,
            preview: p.preview,
            type: p.type,
          }));
    this.swiper.render(swiperItems);
    this.cards.render(generalPrograms);
  }
}
