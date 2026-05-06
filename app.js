// --- Constants and Initialization ---
const LOCAL_STORAGE_KEYS = {
  settings: "zaynTracker_settings",
  streak: "zaynTracker_streak",
  tasks: "zaynTracker_tasks",
  today: "zaynTracker_today",
};
const DEFAULT_TASKS = [
  { id: 1, name: "Study (1:30 hrs)", points: 12 },
  { id: 2, name: "Sleep at 3 AM", points: 8 },
  { id: 3, name: "Bath before sleep", points: 4 },
  { id: 4, name: "Exercise/Running", points: 8 },
  { id: 5, name: "Cracked Past Paper", points: 12 },
];

let currentDay = 1;
let totalDays = 20;
let tasks = [];
let todayScore = 0;
let checkedTaskIds = new Set();

// --- Load and Save State ---
function loadState() {
  const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.settings)) || {};
  totalDays = settings.totalDays || 20;

  const streak = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.streak)) || {};
  currentDay = streak.currentDay || 1;

  tasks = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.tasks)) || DEFAULT_TASKS;

  const today = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.today)) || {};
  todayScore = today.todayScore || 0;
  checkedTaskIds = new Set(today.checkedTaskIds || []);
}

function saveState() {
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.settings,
    JSON.stringify({ totalDays })
  );
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.streak,
    JSON.stringify({ currentDay })
  );
  localStorage.setItem(LOCAL_STORAGE_KEYS.tasks, JSON.stringify(tasks));
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.today,
    JSON.stringify({ todayScore, checkedTaskIds: Array.from(checkedTaskIds) })
  );
}

// --- Rendering ---
function renderTasks() {
  const tasksList = document.getElementById("tasks-list");
  tasksList.innerHTML = "";

  tasks.forEach((task) => {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checkedTaskIds.has(task.id);
    checkbox.addEventListener("change", () => toggleTask(task.id));
    taskItem.appendChild(checkbox);

    // Task Name
    const taskName = document.createElement("span");
    taskName.textContent = task.name + ` (\${task.points} pts)`;
    taskName.style.color = "limegreen";
    taskName.style.marginLeft = "8px";
    taskItem.appendChild(taskName);

    tasksList.appendChild(taskItem);
  });

  updateProgress();
}

// --- Task Toggling ---
function toggleTask(taskId) {
  if (checkedTaskIds.has(taskId)) {
    checkedTaskIds.delete(taskId);
  } else {
    checkedTaskIds.add(taskId);
  }
  saveState();
}

// --- Score Calculation ---
function calculateScore() {
  todayScore = 0;
  tasks.forEach(task => {
    if (checkedTaskIds.has(task.id)) {
      todayScore += task.points;
    }
  });
  saveState();
  alert(`Your score for Day \${currentDay}: \${todayScore} / \${maxPossiblePoints()}`);
}

// --- Next Day Handling ---
function nextDay() {
  if (currentDay < totalDays) {
    currentDay++;
    checkedTaskIds.clear();
    todayScore = 0;
    saveState();
    renderTasks();
  } else {
    alert("You've completed all days! Great job!");
  }
}

// --- Progress Bar and Info ---
function updateProgress() {
  const progressBar = document.getElementById("progress-bar");
  const dayCount = document.getElementById("day-count");
  progressBar.style.width = (currentDay / totalDays) * 100 + "%";
  dayCount.textContent = `Day \${currentDay} of \${totalDays}`;
}

// --- Max Points ---
function maxPossiblePoints() {
  return tasks.reduce((sum, t) => sum + t.points, 0);
}

// --- Setup event listeners ---
document.getElementById("calculate-score-btn").addEventListener("click", calculateScore);
document.getElementById("next-day-btn").addEventListener("click", nextDay);

// --- Initial Load ---
loadState();
renderTasks();
