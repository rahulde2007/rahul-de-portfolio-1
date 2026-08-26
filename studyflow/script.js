const STORAGE_KEY = 'studyflow-data';
const TIMER_SECONDS = 25 * 60;

// Keep all user-editable data in one object so it is easy to save and render.
const defaultState = { tasks: [], goalHours: 2, studySeconds: 0, completedDates: [] };
let state = loadState();
let timerSeconds = TIMER_SECONDS;
let timerId = null;

const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const taskError = document.querySelector('#taskError');
const taskList = document.querySelector('#taskList');
const goalForm = document.querySelector('#goalForm');
const goalInput = document.querySelector('#goalInput');
const goalError = document.querySelector('#goalError');
const editGoalButton = document.querySelector('#editGoalButton');
const timerDisplay = document.querySelector('#timerDisplay');
const timerStatus = document.querySelector('#timerStatus');
const startTimer = document.querySelector('#startTimer');
const pauseTimer = document.querySelector('#pauseTimer');
const resetTimer = document.querySelector('#resetTimer');
const themeToggle = document.querySelector('#themeToggle');
const focusToggle = document.querySelector('#focusToggle');
const exitFocus = document.querySelector('#exitFocus');
const focusPanel = document.querySelector('#focusPanel');

const motivationMessages = [
  'Start with one small task. Momentum can follow.',
  'A focused hour is a meaningful step forward.',
  'Make space for the work that matters today.',
  'Progress is built one completed task at a time.',
  'Your next clear step is enough for now.'
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.tasks)) return { ...defaultState };
    return {
      tasks: saved.tasks.filter((task) => task && typeof task.text === 'string').map((task) => ({ id: task.id || crypto.randomUUID(), text: task.text, completed: Boolean(task.completed) })),
      goalHours: Number(saved.goalHours) > 0 ? Number(saved.goalHours) : defaultState.goalHours,
      studySeconds: Number(saved.studySeconds) >= 0 ? Number(saved.studySeconds) : 0,
      completedDates: Array.isArray(saved.completedDates) ? saved.completedDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) : []
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const remaining = total - completed;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const goalSeconds = state.goalHours * 60 * 60;
  const goalPercentage = Math.min(100, Math.round((state.studySeconds / goalSeconds) * 100));
  const streak = getCurrentStreak();

  document.querySelector('#totalCount').textContent = total;
  document.querySelector('#completedCount').textContent = completed;
  document.querySelector('#remainingCount').textContent = `${remaining} remaining`;
  document.querySelector('#asideCompleted').textContent = completed;
  document.querySelector('#asideRemaining').textContent = remaining;
  document.querySelector('#completionPercent').textContent = percentage;
  document.querySelector('#progressBar').style.width = `${percentage}%`;
  document.querySelector('#progressRing').style.background = `conic-gradient(var(--accent) ${percentage * 3.6}deg, var(--accent-soft) 0deg)`;
  document.querySelector('#progressRing').setAttribute('aria-label', `${percentage} percent of tasks completed`);
  document.querySelector('#goalHours').textContent = state.goalHours;
  document.querySelector('#goalSpent').textContent = `${formatMinutes(state.studySeconds)} logged`;
  document.querySelector('#goalPercent').textContent = `${goalPercentage}%`;
  document.querySelector('#goalProgressBar').style.width = `${goalPercentage}%`;
  document.querySelector('#quickTotal').textContent = total;
  document.querySelector('#quickCompleted').textContent = completed;
  document.querySelector('#quickRemaining').textContent = remaining;
  document.querySelector('#quickPercent').textContent = `${percentage}%`;
  document.querySelector('#streakStat').textContent = `${streak} ${streak === 1 ? 'day' : 'days'} streak`;

  if (!total) {
    taskList.innerHTML = '<div class="empty-state"><strong>Your study space is clear.</strong>Add your first task and start making progress.</div>';
  } else {
    taskList.innerHTML = state.tasks.map((task) => `<div class="task-item ${task.completed ? 'completed' : ''}"><input class="task-check" type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" aria-label="Mark ${escapeHtml(task.text)} as complete"><span class="task-text">${escapeHtml(task.text)}</span><button class="delete-task" type="button" data-delete-id="${task.id}" aria-label="Delete ${escapeHtml(task.text)}" title="Delete task">×</button></div>`).join('');
  }
}

function escapeHtml(text) {
  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

function formatMinutes(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentStreak() {
  const completedDays = new Set(state.completedDates);
  const cursor = new Date();
  let streak = 0;
  while (completedDays.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function recordCompletionToday() {
  const todayKey = getDateKey();
  if (!state.completedDates.includes(todayKey)) state.completedDates.push(todayKey);
}

function showError(element, message) {
  element.textContent = message;
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    showError(taskError, 'Please enter a task before adding it.');
    taskInput.focus();
    return;
  }
  state.tasks.unshift({ id: crypto.randomUUID(), text, completed: false });
  taskInput.value = '';
  showError(taskError, '');
  saveState();
  render();
});

taskList.addEventListener('change', (event) => {
  if (!event.target.matches('.task-check')) return;
  const task = state.tasks.find((item) => item.id === event.target.dataset.taskId);
  if (task) {
    task.completed = event.target.checked;
    if (task.completed) recordCompletionToday();
  }
  saveState();
  render();
});

taskList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-id]');
  if (!button) return;
  state.tasks = state.tasks.filter((task) => task.id !== button.dataset.deleteId);
  saveState();
  render();
});

editGoalButton.addEventListener('click', () => {
  goalForm.classList.toggle('hidden');
  if (!goalForm.classList.contains('hidden')) {
    goalInput.value = state.goalHours;
    goalInput.focus();
  }
});

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = Number(goalInput.value);
  if (!Number.isFinite(value) || value <= 0 || value > 24) {
    showError(goalError, 'Enter a goal between 0.25 and 24 hours.');
    goalInput.focus();
    return;
  }
  state.goalHours = value;
  showError(goalError, '');
  goalForm.classList.add('hidden');
  saveState();
  render();
});

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const seconds = (timerSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function stopTimer(status) {
  clearInterval(timerId);
  timerId = null;
  timerStatus.textContent = status;
}

startTimer.addEventListener('click', () => {
  if (timerId) return;
  timerStatus.textContent = 'FOCUSING';
  timerId = setInterval(() => {
    timerSeconds -= 1;
    state.studySeconds += 1;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      stopTimer('COMPLETE');
      timerSeconds = TIMER_SECONDS;
    }
    if (state.studySeconds % 5 === 0) saveState();
    render();
  }, 1000);
});

pauseTimer.addEventListener('click', () => stopTimer('PAUSED'));
resetTimer.addEventListener('click', () => {
  stopTimer('READY');
  timerSeconds = TIMER_SECONDS;
  updateTimerDisplay();
});

themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-theme');
  themeToggle.textContent = isLight ? '◑' : '◐';
  themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  localStorage.setItem('studyflow-theme', isLight ? 'light' : 'dark');
});

function setFocusMode(enabled) {
  document.body.classList.toggle('focus-mode', enabled);
  focusPanel.classList.toggle('hidden', !enabled);
  focusToggle.setAttribute('aria-pressed', String(enabled));
  focusToggle.innerHTML = enabled ? 'Focus mode <span>●</span>' : 'Focus mode <span>↗</span>';
  if (enabled) window.scrollTo({ top: 0, behavior: 'smooth' });
}

focusToggle.addEventListener('click', () => setFocusMode(!document.body.classList.contains('focus-mode')));
exitFocus.addEventListener('click', () => setFocusMode(false));

function setInitialTheme() {
  const isLight = localStorage.getItem('studyflow-theme') === 'light';
  document.body.classList.toggle('light-theme', isLight);
  themeToggle.textContent = isLight ? '◑' : '◐';
  themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
}

const today = new Date();
document.querySelector('#todayLabel').textContent = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
document.querySelector('#dayNumber').textContent = today.getDate();
document.querySelector('#monthName').innerHTML = `${today.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}<br>${today.getFullYear()}`;
document.querySelector('#motivationMessage').textContent = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
setInitialTheme();
updateTimerDisplay();
render();
