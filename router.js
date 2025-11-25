// router.js

window.chartsInitialized = false;

function showSection(hash) {
  const target = hash || "home";

  // Show the correct section
  document.querySelectorAll(".page-section").forEach(sec => {
    sec.style.display = (sec.id === target) ? "block" : "none";
  });

  // Update active nav link
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href") || "";
    const sectionId = href.replace("#", "");
    link.classList.toggle("active", sectionId === target);
  });

  if (target === "project") {
    if (typeof initWebSocket === "function") {
      initWebSocket();
    }
  }

  // Load charts ONLY once when Analysis is opened
  if (
    target === "analysis" &&
    !window.chartsInitialized &&
    typeof loadResultsAndRenderCharts === "function"
  ) {
    window.chartsInitialized = true;
    loadResultsAndRenderCharts();
  }
}

// Handle hash change
window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "");
  showSection(hash);
});

// Handle initial load
window.addEventListener("DOMContentLoaded", () => {
  const initialHash = window.location.hash.replace("#", "") || "home";
  showSection(initialHash);
});
