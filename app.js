const addExerciseBtn = document.getElementById("addExerciseBtn");
const exportBtn = document.getElementById("exportBtn");
const exerciseList = document.getElementById("exercise-list");
const status = document.getElementById("status");

// Load exercises + PRs from localStorage
let exercises = JSON.parse(localStorage.getItem("exercises")) || [];

// Render all exercises
function renderExercises() {
  exerciseList.innerHTML = "";

  exercises.forEach((ex, index) => {
    const exDiv = document.createElement("div");
    exDiv.className = "exercise";
    exDiv.setAttribute("draggable", true);
    exDiv.dataset.index = index; // merken

    // --- Drag & Drop ---
    exDiv.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      exDiv.style.opacity = "0.5";
    });

    exDiv.addEventListener("dragend", () => {
      exDiv.style.opacity = "1";
    });

    exDiv.addEventListener("dragover", (e) => e.preventDefault());

    exDiv.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromIndex = Number(e.dataTransfer.getData("text/plain"));
      const toIndex = Number(exDiv.dataset.index);

      if (fromIndex === toIndex) return;

      // Move exercise in array
      const moved = exercises.splice(fromIndex, 1)[0];
      exercises.splice(toIndex, 0, moved);

      // Re-render and save
      saveAndRender("Exercises sorted");
    });

    // --- Rest: header, PRs, buttons ---
  const header = document.createElement("div");
  header.className = "exercise-header";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = ex.name;
  header.appendChild(nameSpan);

  // Button-Gruppe rechts
  const buttonGroup = document.createElement("div");
  buttonGroup.className = "button-group";

  // + PR Button
  const addPrBtn = document.createElement("button");
  addPrBtn.textContent = "+";
  addPrBtn.onclick = () => addPR(index);
  buttonGroup.appendChild(addPrBtn);


  // Delete Button
  const delBtn = document.createElement("button");
  delBtn.textContent = "x";
  delBtn.onclick = () => deleteExercise(index);
  buttonGroup.appendChild(delBtn);

  header.appendChild(buttonGroup);


    exDiv.appendChild(header);

    // PR list (wie vorher)
    // PR list
    const prDiv = document.createElement("div");
    prDiv.className = "pr-list";

    if (ex.prs.length > 0) {
      const sortedPRs = sortPRsByDate([...ex.prs]); // neueste zuerst
      const latest = sortedPRs[0];

      const latestDiv = document.createElement("div");
      latestDiv.className = "pr-item";
      latestDiv.textContent = `${latest.reps} × ${latest.weight} (${latest.date})`;

      if (sortedPRs.length > 1) {
        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = "⬇";
        toggleBtn.style.marginLeft = "0.5rem";

        const oldPrDiv = document.createElement("div");
        oldPrDiv.style.display = "none";

        // alle außer dem neuesten
        sortedPRs.slice(1).forEach(pr => {
          const prItem = document.createElement("div");
          prItem.className = "old-pr";
          prItem.textContent = `${pr.reps} × ${pr.weight} (${pr.date})`;
          oldPrDiv.appendChild(prItem);
        });

        toggleBtn.onclick = () => {
          const isOpen = oldPrDiv.style.display !== "none";
          oldPrDiv.style.display = isOpen ? "none" : "block";
          toggleBtn.classList.toggle("open", !isOpen);
        };

        latestDiv.appendChild(toggleBtn);
        prDiv.appendChild(latestDiv);
        prDiv.appendChild(oldPrDiv);
      } else {
        prDiv.appendChild(latestDiv);
      }
    }

    exDiv.appendChild(prDiv);

    exerciseList.appendChild(exDiv);
  });
}


// ------------------- Functions -------------------

// Add new exercise
addExerciseBtn.addEventListener("click", () => {
  const name = prompt("EXERCISE");
  if (!name) return;
  exercises.push({ name, prs: [] });
  saveAndRender("Exercise added");
});

// Add new PR
function addPR(exIndex) {
  const lastPR = exercises[exIndex].prs.length
    ? exercises[exIndex].prs[exercises[exIndex].prs.length - 1]
    : { weight: "", reps: "" };

  const weight = prompt("WEIGHT", lastPR.weight);
  if (!weight) return;
  const reps = prompt("REPS", lastPR.reps);
  if (!reps) return;
  const date = prompt("(YYYY-MM-DD) [BLANK FOR TODAY]") || new Date().toISOString().slice(0,10);

  exercises[exIndex].prs.push({ weight, reps, date });
  saveAndRender("PR added");
}

// Delete exercise
function deleteExercise(index) {
  if (!confirm(`Delete exercise "${exercises[index].name}"?`)) return;
  exercises.splice(index, 1);
  saveAndRender("Exercise deleted");
}


// Export backup as JSON
exportBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(exercises, null, 2);
  const blob = new Blob([dataStr], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `pr_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showStatus("Backup exported");
});

// Helper: save to localStorage + render + status
function saveAndRender(msg) {
  localStorage.setItem("exercises", JSON.stringify(exercises));
  renderExercises();
  showStatus(msg);
}

// Status message
function showStatus(msg) {
  status.textContent = msg;
  setTimeout(() => status.textContent = "", 1500);
}

// Initial render
renderExercises();

// Service Worker for PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}


const importInput = document.getElementById("importInput");
const importBtn = document.getElementById("importBtn");

importBtn.addEventListener("click", () => {
  importInput.click(); // öffnet Dateiauswahl
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (!Array.isArray(importedData)) throw new Error("Invalid format");
      exercises = importedData;
      localStorage.setItem("exercises", JSON.stringify(exercises));
      renderExercises();
      showStatus("Backup imported");
    } catch (err) {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
});

function sortPRsByDate(prs) {
  return prs.sort((a, b) => new Date(b.date) - new Date(a.date));
}
