/**
 * Persona 5 Royal Mobile Walkthrough Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- State Variables ---
  let currentMonth = "7月";
  let activeProgress = null;

  // --- DOM Elements ---
  const menuBtn = document.getElementById("menu-btn");
  const sidebarDrawer = document.getElementById("sidebar-drawer");
  const closeDrawerBtn = document.getElementById("close-drawer-btn");
  const drawerBackdrop = sidebarDrawer.querySelector(".drawer-backdrop");
  const monthTabsContainer = document.getElementById("month-tabs");
  const monthNotesList = document.getElementById("month-notes-list");
  const scheduleContainer = document.getElementById("schedule-container");
  const headerStarBtn = document.getElementById("scroll-to-progress-btn");
  const floatingJumpBtn = document.getElementById("floating-jump-btn");
  const mainContent = document.querySelector(".app-main-content");
  
  const menuMainWalkthrough = document.getElementById("menu-main-walkthrough");
  const walkthroughView = document.getElementById("walkthrough-view");
  const technicalView = document.getElementById("technical-view");
  const palaceView = document.getElementById("palace-view");
  const menuWalkthroughItem = document.getElementById("menu-walkthrough-item");
  const menuTechnicalItem = document.getElementById("menu-technical-item");
  const menuTechnical = document.getElementById("menu-technical");
  
  const menuPalaceItem = document.getElementById("menu-palace-item");
  const menuPalaceToggle = document.getElementById("menu-palace-toggle");

  // --- Load Progress from localStorage ---
  function loadProgress() {
    const saved = localStorage.getItem("p5r_walkthrough_progress");
    if (saved) {
      try {
        activeProgress = JSON.parse(saved);
        headerStarBtn.classList.add("active");
      } catch (e) {
        console.error("Error parsing saved progress:", e);
        activeProgress = null;
      }
    } else {
      activeProgress = null;
      headerStarBtn.classList.remove("active");
    }
    updateFloatingButtonVisibility();
  }

  // --- Save Progress to localStorage ---
  function saveProgress(month, dayId) {
    activeProgress = { month, dayId };
    localStorage.setItem("p5r_walkthrough_progress", JSON.stringify(activeProgress));
    headerStarBtn.classList.add("active");
    updateFloatingButtonVisibility();
  }

  // --- Sidebar Controls ---
  function openDrawer() {
    sidebarDrawer.classList.add("open");
    sidebarDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Prevent background scrolling on mobile
  }

  function closeDrawer() {
    sidebarDrawer.classList.remove("open");
    sidebarDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; // Restore scrolling
  }

  // Trigger bindings
  menuBtn.addEventListener("click", openDrawer);
  closeDrawerBtn.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);

  // --- Page Switcher ---
  let currentPage = "walkthrough";

  function switchPage(page) {
    currentPage = page;
    
    // Hide all views
    walkthroughView.classList.add("hidden");
    technicalView.classList.add("hidden");
    palaceView.classList.add("hidden");
    
    // Reset active menu states
    menuWalkthroughItem.classList.remove("active");
    menuTechnicalItem.classList.remove("active");
    menuPalaceItem.classList.remove("active");
    
    // Reset active submenu states
    document.querySelectorAll(".submenu-item").forEach(item => item.classList.remove("active"));
    
    if (page === "walkthrough") {
      walkthroughView.classList.remove("hidden");
      menuWalkthroughItem.classList.add("active");
      updateFloatingButtonVisibility();
    } else if (page === "technical") {
      technicalView.classList.remove("hidden");
      menuTechnicalItem.classList.add("active");
      floatingJumpBtn.classList.remove("visible");
    } else if (page === "palace") {
      palaceView.classList.remove("hidden");
      menuPalaceItem.classList.add("active");
      floatingJumpBtn.classList.remove("visible");
    }
  }

  // --- Render Palace Content ---
  function renderPalaceContent(palaceKey) {
    const palace = palaceWalkthroughData[palaceKey];
    if (!palace) return;

    palaceView.innerHTML = "";

    // If pending, render the placeholder
    if (palace.status === "pending") {
      palaceView.innerHTML = `
        <div class="pending-palace-view">
          <div class="pending-icon">🔮</div>
          <h2>${palace.name}</h2>
          <p>攻略內容正在整理中，待後續新增！</p>
        </div>
      `;
      return;
    }

    let htmlContent = "";

    // 1. Render Title Banner
    htmlContent += `
      <div class="palace-title-card">
        <div class="card-main-title">${palace.name}</div>
        <div class="card-sub-title">PALACE WALKTHROUGH</div>
      </div>
    `;

    // Helper for attributes detail grid
    function buildAttributeGrid(attrs, remarks) {
      const allAttributes = [
        { key: "物", label: "物" },
        { key: "枪", label: "槍" },
        { key: "火", label: "火" },
        { key: "冰", label: "冰" },
        { key: "电", label: "電" },
        { key: "风", label: "風" },
        { key: "念", label: "念" },
        { key: "核", label: "核" },
        { key: "祝", label: "祝" },
        { key: "咒", label: "咒" }
      ];
      
      const gridHTML = allAttributes.map(attr => {
        const val = attrs[attr.key] || "";
        let valClass = "none";
        if (val === "弱") valClass = "weak";
        else if (val === "耐") valClass = "resist";
        else if (val === "无") valClass = "nullify";
        else if (val === "反") valClass = "reflect";
        else if (val === "吸") valClass = "absorb";
        
        return `
          <div class="attribute-grid-item">
            <span class="attr-label">${attr.label}</span>
            <span class="attr-value ${valClass}">${val || "-"}</span>
          </div>
        `;
      }).join("");

      let remarksHTML = "";
      if (remarks && remarks.trim() !== "") {
        remarksHTML = `
          <div class="status-immunities-box">
            <strong>抗性備註:</strong> ${remarks}
          </div>
        `;
      }

      return `
        <div class="attribute-detail-panel">
          <div class="attribute-grid">
            ${gridHTML}
          </div>
          ${remarksHTML}
        </div>
      `;
    }

    // Helper for rendering table categories
    function renderEnemyTable(title, list, showRemarks = true) {
      if (!list || list.length === 0) return "";
      
      let rowsHTML = "";
      list.forEach((enemy, index) => {
        const rowId = `enemy-${enemy.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")}-${index}`;
        
        let nameDisplay = enemy.name;
        if (enemy.alias && enemy.alias !== enemy.name) {
          nameDisplay += ` <span style="font-size: 0.8rem; color: #888;">(${enemy.alias})</span>`;
        }

        const remarksValue = showRemarks ? (enemy.remarks || (enemy.drop_items ? `掉落: ${enemy.drop_items}` : "")) : "";

        rowsHTML += `
          <tr class="enemy-row" data-target="${rowId}">
            <td style="text-align: center;">${enemy.lv}</td>
            <td>${enemy.arcana || "-"}</td>
            <td><strong>${nameDisplay}</strong></td>
            <td style="text-align: center; white-space: nowrap;"><span class="attr-click-badge">▶ 查看屬性</span></td>
          </tr>
          <tr class="attribute-detail-row hidden" id="row-${rowId}">
            <td colspan="4" style="padding: 0;">
              ${buildAttributeGrid(enemy.attributes, remarksValue)}
            </td>
          </tr>
        `;
      });

      return `
        <div class="technical-table-wrapper" style="margin-top: 15px; margin-bottom: 25px;">
          <div class="table-subtitle">${title}</div>
          <table class="p5-table">
            <thead>
              <tr>
                <th class="skew-th" style="width: 50px; text-align: center;">LV</th>
                <th class="skew-th" style="width: 80px;">阿卡納</th>
                <th class="skew-th">名稱</th>
                <th class="skew-th" style="width: 100px; text-align: center;">屬性抗性</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      `;
    }

    // 3. Render enemies
    if (palace.enemies) {
      htmlContent += `
        <section class="schedule-section">
          <div class="section-title-banner">
            <span class="banner-skew"></span>
            <h2>殿堂數據</h2>
          </div>
          ${renderEnemyTable("★ 普通敵人", palace.enemies.ordinary, false)}
          ${renderEnemyTable("★ 強敵", palace.enemies.strong, true)}
          ${renderEnemyTable("★ 首領 (BOSS)", palace.enemies.boss, true)}
        </section>
      `;
    }

    // 4. Render Will Seeds
    if (palace.willSeeds && palace.willSeeds.length > 0) {
      let seedColors = ["red", "green", "blue"];
      htmlContent += `
        <section class="schedule-section">
          <div class="section-title-banner">
            <span class="banner-skew"></span>
            <h2>欲石攻略</h2>
          </div>
          <div class="willseeds-grid">
            ${palace.willSeeds.map((seed, idx) => `
              <div class="willseed-card">
                <div class="willseed-card-header">
                  <span class="seed-icon ${seedColors[idx]}">★</span>
                  <h3>${seed.name}</h3>
                </div>
                <div class="willseed-image-container">
                  <img src="${seed.image}" alt="${seed.name}位置圖" loading="lazy" />
                </div>
                <div class="willseed-card-body">
                  <p>在此殿堂中獲取<strong>${seed.name}</strong>以恢復部分SP，收集齊三個可合成強力飾品。</p>
                </div>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    }

    // 5. Render Puzzle
    if (palace.puzzle) {
      htmlContent += `
        <section class="schedule-section">
          <div class="section-title-banner">
            <span class="banner-skew"></span>
            <h2>其他 (謎題解法)</h2>
          </div>
          <div class="puzzle-card">
            <div class="willseed-card-header">
              <span class="seed-icon" style="color: var(--p5-gold);">⚙</span>
              <h3>${palace.puzzle.title}</h3>
            </div>
            <div class="puzzle-image-container">
              <img src="${palace.puzzle.image}" alt="${palace.puzzle.title}圖解" loading="lazy" />
            </div>
          </div>
        </section>
      `;
    }

    palaceView.innerHTML = htmlContent;

    // Attach row toggle event listeners
    palaceView.querySelectorAll(".enemy-row").forEach(row => {
      row.addEventListener("click", () => {
        const targetId = row.getAttribute("data-target");
        const targetRow = palaceView.querySelector(`#row-${targetId}`);
        if (targetRow) {
          const wasHidden = targetRow.classList.contains("hidden");
          if (wasHidden) {
            targetRow.classList.remove("hidden");
            row.querySelector(".attr-click-badge").innerHTML = "▼ 收起屬性";
          } else {
            targetRow.classList.add("hidden");
            row.querySelector(".attr-click-badge").innerHTML = "▶ 查看屬性";
          }
        }
      });
    });
  }

  // Close drawer on clicking menu items
  menuMainWalkthrough.addEventListener("click", (e) => {
    e.preventDefault();
    closeDrawer();
    switchPage("walkthrough");
    mainContent.scrollTo({ top: 0, behavior: "smooth" });
  });

  menuTechnical.addEventListener("click", (e) => {
    e.preventDefault();
    closeDrawer();
    switchPage("technical");
    mainContent.scrollTo({ top: 0, behavior: "smooth" });
  });

  menuPalaceToggle.addEventListener("click", (e) => {
    e.preventDefault();
    menuPalaceItem.classList.toggle("submenu-open");
  });

  document.querySelectorAll(".submenu-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const palaceKey = item.getAttribute("data-palace");
      
      // Remove active states from other submenus
      document.querySelectorAll(".submenu-item").forEach(sub => sub.classList.remove("active"));
      item.classList.add("active");
      
      closeDrawer();
      switchPage("palace");
      renderPalaceContent(palaceKey);
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // ESC key to close drawer
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebarDrawer.classList.contains("open")) {
      closeDrawer();
    }
  });

  // --- Render Month Tabs ---
  function renderMonthTabs() {
    monthTabsContainer.innerHTML = "";
    const months = Object.keys(walkthroughData);
    
    months.forEach(month => {
      const btn = document.createElement("button");
      btn.className = "month-tab-btn";
      if (month === currentMonth) {
        btn.classList.add("active");
      }
      btn.textContent = month;
      
      btn.addEventListener("click", () => {
        if (currentMonth !== month) {
          currentMonth = month;
          renderMonthTabs();
          renderMonthContent();
          mainContent.scrollTo({ top: 0, behavior: "instant" });
        }
      });
      
      monthTabsContainer.appendChild(btn);
    });

    // Auto scroll tabs wrapper to center active tab
    const activeBtn = monthTabsContainer.querySelector(".month-tab-btn.active");
    if (activeBtn) {
      const containerWidth = monthTabsContainer.parentElement.offsetWidth;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      monthTabsContainer.parentElement.scrollTo({
        left: btnLeft - containerWidth / 2 + btnWidth / 2,
        behavior: "smooth"
      });
    }
  }

  // --- Render Month Contents (Notes & Daily cards) ---
  function renderMonthContent() {
    const data = walkthroughData[currentMonth];
    
    // 1. Render Monthly Notes
    monthNotesList.innerHTML = "";
    if (data.notes && data.notes.length > 0) {
      data.notes.forEach(note => {
        const li = document.createElement("li");
        li.textContent = note;
        monthNotesList.appendChild(li);
      });
      document.querySelector(".overview-section").style.display = "block";
    } else {
      document.querySelector(".overview-section").style.display = "none";
    }

    // 2. Render Daily Cards
    scheduleContainer.innerHTML = "";
    if (data.schedule && data.schedule.length > 0) {
      data.schedule.forEach(day => {
        const isCurrent = activeProgress && activeProgress.month === currentMonth && activeProgress.dayId === day.id;
        
        const card = document.createElement("div");
        card.className = "day-card";
        card.id = `day-card-${day.id}`;
        if (isCurrent) {
          card.classList.add("active-progress");
        }

        // Determine weekday styling
        let weekClass = "weekday";
        if (day.dayOfWeek === "六") {
          weekClass = "sat";
        } else if (day.dayOfWeek === "日") {
          weekClass = "sun";
        }

        // Build Inner HTML
        let cardHTML = `
          <div class="card-header-row">
            <div class="date-badge">
              <span class="skew-fill"></span>
              <span class="date-text">${day.date}</span>
            </div>
            <div>
              <span class="day-of-week ${weekClass}">${day.dayOfWeek}</span>
            </div>
            ${isCurrent ? '<div class="progress-now-badge">當前進度</div>' : ''}
          </div>
          
          <div class="activities-box">
            <div class="activity-row daytime-row">
              <div class="activity-time-lbl">☀️ AFTERNOON</div>
              <ul class="activity-list">
                ${day.daytime.map(item => `<li>${item}</li>`).join("")}
              </ul>
            </div>
            <div class="activity-row nighttime-row">
              <div class="activity-time-lbl">🌙 NIGHT</div>
              <ul class="activity-list">
                ${day.nighttime.map(item => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          </div>
        `;

        // Remarks Block
        if (day.remarks && day.remarks.trim() !== "") {
          cardHTML += `
            <div class="remarks-row">
              <strong>MEMO:</strong> ${day.remarks}
            </div>
          `;
        }

        // Set Progress Button
        cardHTML += `
          <button class="progress-setter-btn" data-id="${day.id}">
            <span>${isCurrent ? "★ 當前進度 (已記錄)" : "☆ 設為當前進度"}</span>
          </button>
        `;

        card.innerHTML = cardHTML;

        // Button Click Event
        const setBtn = card.querySelector(".progress-setter-btn");
        setBtn.addEventListener("click", () => {
          saveProgress(currentMonth, day.id);
          renderMonthContent(); // Re-render this month to refresh active visual class
        });

        scheduleContainer.appendChild(card);
      });
    } else {
      scheduleContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">本月無攻略內容</div>`;
    }
  }

  // --- Scroll to Current Progress ---
  function scrollToCurrentProgress() {
    if (!activeProgress) return;
    
    // 1. Check if progress is in current month, if not switch month
    if (activeProgress.month !== currentMonth) {
      currentMonth = activeProgress.month;
      renderMonthTabs();
      renderMonthContent();
    }
    
    // 2. Smooth scroll to the element
    setTimeout(() => {
      const element = document.getElementById(`day-card-${activeProgress.dayId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Add a temporary glow animation to reinforce focus
        element.style.transform = "scale(1.05)";
        setTimeout(() => {
          element.style.transform = "";
        }, 600);
      }
    }, 100);
  }

  // --- Floating Button Visibility ---
  function updateFloatingButtonVisibility() {
    if (!activeProgress || currentPage !== "walkthrough") {
      floatingJumpBtn.classList.remove("visible");
      return;
    }
    
    // Show only when user has scrolled down a bit
    if (mainContent.scrollTop > 200) {
      floatingJumpBtn.classList.add("visible");
    } else {
      floatingJumpBtn.classList.remove("visible");
    }
  }

  // Listen to main content scroll events
  mainContent.addEventListener("scroll", updateFloatingButtonVisibility);
  
  // Jump event listeners
  floatingJumpBtn.addEventListener("click", () => {
    if (currentPage !== "walkthrough") {
      switchPage("walkthrough");
    }
    scrollToCurrentProgress();
  });
  headerStarBtn.addEventListener("click", () => {
    if (currentPage !== "walkthrough") {
      switchPage("walkthrough");
    }
    scrollToCurrentProgress();
  });

  // --- App Startup Setup ---
  function initApp() {
    loadProgress();
    
    // If progress exists, jump directly to it
    if (activeProgress) {
      currentMonth = activeProgress.month;
      renderMonthTabs();
      renderMonthContent();
      
      // Auto-jump on load (give browser a tiny bit of layout time)
      setTimeout(scrollToCurrentProgress, 300);
    } else {
      // Default to 7月
      currentMonth = "7月";
      renderMonthTabs();
      renderMonthContent();
    }
  }

  // Run initialization
  initApp();
});
