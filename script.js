const STORAGE_KEY = "taskflow_tasks";

let tasks = [];
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  tasks = saved ? JSON.parse(saved) : [];
  if (!Array.isArray(tasks)) tasks = [];
} catch (e) {
  tasks = [];
}

let filter = "all";
let editingId = null;

const $ = id => document.getElementById(id);
const form = $("taskForm"), titleInput = $("taskInput");
const categoryInput = $("category"), priorityInput = $("priority");
const taskList = $("taskList"), searchInput = $("searchInput");

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks:", e);
  }
}

function getVisibleTasks() {
  const query = searchInput.value.toLowerCase().trim();
  return tasks.filter(task => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" ? !task.completed : Boolean(task.completed));
    const matchesQuery = !query || (task.title && task.title.toLowerCase().includes(query));
    return matchesFilter && matchesQuery;
  });
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  $("totalCount").textContent = total;
  $("activeCount").textContent = total - completed;
  $("completedCount").textContent = completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  $("progressText").textContent = progress + "%";
  $("progressFill").style.width = progress + "%";
}

function renderTasks() {
  taskList.innerHTML = "";
  const visible = getVisibleTasks();
  if (!visible.length) {
    taskList.innerHTML = '<div class="empty"><b>🌱</b>No tasks found.<br><small>Add a task and start making progress.</small></div>';
    return;
  }
  visible.forEach(task => {
    const item = document.createElement("article");
    item.className = "task" + (task.completed ? " completed" : "");
    item.dataset.id = task.id;
    item.innerHTML = `
      <div class="task-left">
        <input class="check" type="checkbox" data-action="toggle" ${task.completed ? "checked" : ""}>
        <div>
          <div class="task-title"></div>
          <div class="meta">
            <span class="badge category"></span>
            <span class="badge ${task.priority.toLowerCase()}">${task.priority} Priority</span>
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="edit" data-action="edit">✏️ Edit</button>
        <button class="delete" data-action="delete">🗑️</button>
      </div>`;
    item.querySelector(".task-title").textContent = task.title;
    item.querySelector(".category").textContent = task.category;
    taskList.appendChild(item);
  });
}

function resetEditState() {
  editingId = null;
  form.reset();
  $("submitBtn").textContent = "＋ Add Task";
  $("cancelBtn").classList.add("hidden");
  $("formTitle").textContent = "Create a task ✨";
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  if (editingId !== null) {
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      Object.assign(task, {
        title,
        category: categoryInput.value,
        priority: priorityInput.value
      });
    }
    resetEditState();
  } else {
    tasks.unshift({
      id: Date.now(),
      title,
      category: categoryInput.value,
      priority: priorityInput.value,
      completed: false
    });
    form.reset();
  }
  saveTasks();
  renderTasks();
  updateStats();
});

taskList.addEventListener("click", e => {
  const button = e.target.closest("button[data-action]");
  if (!button) return;
  const item = button.closest(".task");
  if (!item) return;
  const id = Number(item.dataset.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (button.dataset.action === "delete") {
    tasks = tasks.filter(t => t.id !== id);
    if (editingId === id) {
      resetEditState();
    }
    saveTasks();
    renderTasks();
    updateStats();
  } else if (button.dataset.action === "edit") {
    titleInput.value = task.title;
    categoryInput.value = task.category;
    priorityInput.value = task.priority;
    editingId = id;
    $("submitBtn").textContent = "Save Changes";
    $("cancelBtn").classList.remove("hidden");
    $("formTitle").textContent = "Edit your task ✏️";
    titleInput.focus();
  }
});

taskList.addEventListener("change", e => {
  if (e.target.dataset.action !== "toggle") return;
  const item = e.target.closest(".task");
  if (!item) return;
  const id = Number(item.dataset.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = e.target.checked;
  saveTasks();
  renderTasks();
  updateStats();
});

document.querySelector(".filters").addEventListener("click", e => {
  const button = e.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  renderTasks();
});

searchInput.addEventListener("input", renderTasks);

$("cancelBtn").addEventListener("click", resetEditState);

$("date").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
});

renderTasks();
updateStats();
