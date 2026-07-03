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

  // Close drawer on clicking menu items
  menuMainWalkthrough.addEventListener("click", (e) => {
    e.preventDefault();
    closeDrawer();
    // Already on main page, scroll to top
    mainContent.scrollTo({ top: 0, behavior: "smooth" });
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
    if (!activeProgress) {
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
  floatingJumpBtn.addEventListener("click", scrollToCurrentProgress);
  headerStarBtn.addEventListener("click", scrollToCurrentProgress);

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
