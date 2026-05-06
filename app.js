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
  // Add remaining default tasks here...
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

  let totalPossiblePoints = 0;
  
  tasks.forEach((task) => {
    totalPossiblePoints += task.points;
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checkedTaskIds.has(task.id);
    checkbox.addEventListener("change", () => toggleTask(task.id));
    taskItem.appendChild(checkbox);

    // Editable Task Name
    const taskName = document.createElement("input");
    taskName.type = "text";
    taskName.value = task.name;
    taskItem.appendChild(taskName);

    // Editable Task Points
    const taskPoints = document.createElement("input");
    taskPoints.type = "number";
    taskPoints.min = 0;
    taskPoints.value = task.points;
    taskItem.appendChild(taskPoints);

    tasksList.appendChild(taskItem);
  });
}

// --- Main Logic ---
loadState();
renderTasks();
