/**
 * js/components/GradesDashboard.js
 * Manages the custom grades dashboard. Fetches data from Google Sheets,
 * populates filters, and renders the leaderboards and score card.
 */

export class GradesDashboard {
  constructor(config) {
    this.config = config;
    this.initialized = false;
    this.rawData = [];

    // Hardcoded from the original new grades.html
    this.sheetId = '15qGmlrNz3XCnu8a6IhudbSOtWgiGhYjljRezfLHWo5E';
    this.sheetName = 'داتا ستيديو';
  }

  async init(settings) {
    if (this.initialized) return;

    if (settings && settings.gradesReady === false) {
      const dashboard = document.getElementById('grades-dashboard');
      if (dashboard) {
        dashboard.innerHTML = `
          <div class="embed-area">
            <i class="ti ti-clock-hour-4" aria-hidden="true"></i>
            <h3>جاري تحديث الدرجات</h3>
            <p>نعمل حالياً على تحديث ورصد الدرجات، وستكون متاحة هنا قريباً بإذن الله</p>
          </div>`;
      }
      this.initialized = true; // Prevent re-fetching
      return;
    }

    this.showLoading(true);

    try {
      const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(this.sheetName)}`;
      const response = await fetch(url, { cache: "no-store" });
      const text = await response.text();
      // Remove the JSONP padding
      const json = JSON.parse(text.substring(47).slice(0, -2));

      this.rawData = json.table.rows.map(row => {
        return {
          student: row.c[0] && row.c[0].v ? row.c[0].v : '',
          halaqah: row.c[1] && row.c[1].v ? row.c[1].v : '',
          program: row.c[2] && row.c[2].v ? row.c[2].v : '',
          score: row.c[3] && row.c[3].v ? Number(row.c[3].v) : 0,
          stage: row.c[4] && row.c[4].v ? row.c[4].v : 'غير محدد'
        };
      }).filter(row => row.student !== '' && row.student !== 'اسم الطالب');

      this.showLoading(false);
      this.initFilters();
      this.updateDashboard();
      this.initialized = true;

    } catch (error) {
      console.error("Error fetching grades data: ", error);
      const loadingEl = document.getElementById('grades-loading');
      if (loadingEl) {
        loadingEl.className = 'data-status error';
        loadingEl.innerHTML = '<i class="ti ti-alert-triangle"></i> حدث خطأ أثناء جلب البيانات. تأكد من أن الشيت متاح للقراءة واسم الصفحة صحيح.';
      }
    }
  }

  showLoading(show) {
    const loadingEl = document.getElementById('grades-loading');
    if (loadingEl) {
      loadingEl.style.display = show ? 'flex' : 'none';
    }
  }

  initFilters() {
    const halaqahs = [...new Set(this.rawData.map(item => item.halaqah))].sort();
    const programs = [...new Set(this.rawData.map(item => item.program))].sort();

    const halaqahSelect = document.getElementById('halaqahFilter');
    const programSelect = document.getElementById('programFilter');
    const studentSelect = document.getElementById('studentFilter');

    if (!halaqahSelect || !programSelect || !studentSelect) return;

    halaqahs.forEach(h => halaqahSelect.add(new Option(h, h)));
    programs.forEach(p => programSelect.add(new Option(p, p)));

    halaqahSelect.addEventListener('change', () => {
      this.updateStudentDropdown();
      this.updateDashboard();
    });

    studentSelect.addEventListener('change', () => this.updateDashboard());
    programSelect.addEventListener('change', () => this.updateDashboard());

    this.updateStudentDropdown();
  }

  updateStudentDropdown() {
    const selectedHalaqah = document.getElementById('halaqahFilter').value;
    const studentSelect = document.getElementById('studentFilter');

    if (!studentSelect) return;

    const currentSelectedStudent = studentSelect.value;
    studentSelect.innerHTML = '<option value="الكل">الكل (عرض الأوائل)</option>';

    let filteredStudents = this.rawData;
    if (selectedHalaqah !== 'الكل') {
      filteredStudents = this.rawData.filter(item => item.halaqah === selectedHalaqah);
    }

    const students = [...new Set(filteredStudents.map(item => item.student))].sort();
    students.forEach(s => studentSelect.add(new Option(s, s)));

    if (students.includes(currentSelectedStudent)) {
      studentSelect.value = currentSelectedStudent;
    }
  }

  updateDashboard() {
    const halaqahFilter = document.getElementById('halaqahFilter');
    const studentFilter = document.getElementById('studentFilter');
    const programFilter = document.getElementById('programFilter');
    const scoreTitle = document.getElementById('scoreTitle');
    const leaderboardsGrid = document.getElementById('leaderboardsGrid');
    const detailsContainer = document.getElementById('studentDetailsContainer');

    if (!halaqahFilter || !studentFilter || !programFilter) return;

    const selectedHalaqah = halaqahFilter.value;
    const selectedStudent = studentFilter.value;
    const selectedProgram = programFilter.value;

    let filteredData = this.rawData;
    if (selectedHalaqah !== 'الكل') filteredData = filteredData.filter(d => d.halaqah === selectedHalaqah);
    if (selectedStudent !== 'الكل') filteredData = filteredData.filter(d => d.student === selectedStudent);
    if (selectedProgram !== 'الكل') filteredData = filteredData.filter(d => d.program === selectedProgram);

    const totalScore = filteredData.reduce((sum, item) => sum + item.score, 0);
    this.animateValue("totalPoints", 0, totalScore, 1000);

    detailsContainer.innerHTML = '';

    if (selectedStudent !== 'الكل') {
      scoreTitle.innerText = `إجمالي نقاط الطالب: ${selectedStudent}`;
      leaderboardsGrid.innerHTML = '';

      let programScores = {};
      filteredData.forEach(item => {
        if (!programScores[item.program]) programScores[item.program] = 0;
        programScores[item.program] += item.score;
      });

      if (Object.keys(programScores).length > 0) {
        let detailsHTML = `
          <table class="student-details-table">
            <thead>
              <tr>
                <th>اسم البرنامج</th>
                <th>النقاط المكتسبة</th>
              </tr>
            </thead>
            <tbody>
        `;
        for (let prog in programScores) {
          detailsHTML += `<tr><td>${prog}</td><td>${programScores[prog]}</td></tr>`;
        }
        detailsHTML += `</tbody></table>`;
        detailsContainer.innerHTML = detailsHTML;
      }
    } else {
      scoreTitle.innerText = 'إجمالي النقاط';
      this.renderLeaderboards(filteredData);
    }
  }

  renderLeaderboards(data) {
    const grid = document.getElementById('leaderboardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const aggregated = {};

    data.forEach(item => {
      if (!aggregated[item.stage]) aggregated[item.stage] = {};

      if (!aggregated[item.stage][item.student]) {
        aggregated[item.stage][item.student] = {
          student: item.student,
          halaqah: item.halaqah,
          totalScore: 0
        };
      }
      aggregated[item.stage][item.student].totalScore += item.score;
    });

    for (const stage in aggregated) {
      let studentsArr = Object.values(aggregated[stage]);
      studentsArr.sort((a, b) => b.totalScore - a.totalScore);
      let top10 = studentsArr.slice(0, 10);

      if (top10.length === 0) continue;

      let tableHTML = `
        <div class="stage-table-container">
          <h3 class="stage-title">المرحلة: ${stage} (أفضل 10)</h3>
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الطالب</th>
                <th>الحلقة</th>
                <th>النقاط</th>
              </tr>
            </thead>
            <tbody>
      `;

      top10.forEach((s, index) => {
        tableHTML += `
          <tr>
            <td><span class="rank">${index + 1}</span></td>
            <td>${s.student}</td>
            <td>${s.halaqah}</td>
            <td><strong>${s.totalScore}</strong></td>
          </tr>
        `;
      });

      tableHTML += `</tbody></table></div>`;
      grid.innerHTML += tableHTML;
    }
  }

  animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;

    if (start === end) {
      obj.innerHTML = end.toLocaleString('en-US');
      return;
    }

    let range = end - start;
    let current = start;
    let increment = end > start ? Math.ceil(range / 20) : -1;
    let stepTime = Math.abs(Math.floor(duration / (range / increment)));

    // Handle very fast animations or 0 duration
    if (stepTime < 10) stepTime = 10;

    let timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      obj.innerHTML = current.toLocaleString('en-US');
    }, stepTime);
  }
}
