let currentSummaryType = "short";

// Theme handling
function toggleTheme() {
  const body = document.body;
  const isDark = body.getAttribute("data-theme") === "dark";
  body.setAttribute("data-theme", isDark ? "light" : "dark");
  localStorage.setItem("theme", isDark ? "light" : "dark");
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.querySelector(
    ".theme-toggle .material-symbols-rounded"
  );
  const isDark = document.body.getAttribute("data-theme") === "dark";
  icon.textContent = isDark ? "light_mode" : "dark_mode";
}

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "light";
document.body.setAttribute("data-theme", savedTheme);
updateThemeIcon();

// Summary type selection
document.querySelectorAll(".option").forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll(".option")
      .forEach((opt) => opt.classList.remove("active"));
    option.classList.add("active");
    currentSummaryType = option.dataset.type;
  });
});

async function generateSummary() {
  const text = document.getElementById("text-input").value.trim();
  if (!text) {
    alert("Please enter some text first!");
    return;
  }

  try {
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summaryType: currentSummaryType,
        text: text,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const summary = data.summary;
    document.getElementById("summary-content").textContent = summary;
    document.querySelector(".input-section").style.display = "none";
    document.getElementById("summary-section").style.display = "block";
  } catch (error) {
    console.error("Error:", error);
    alert("Error generating summary. Please try again.");
  }
}

function resetSummary() {
  document.getElementById("text-input").value = "";
  document.querySelector(".input-section").style.display = "block";
  document.getElementById("summary-section").style.display = "none";
}
