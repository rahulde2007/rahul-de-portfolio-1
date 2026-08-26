const STORAGE_KEY = 'army-ready-data';
const TIMER_SECONDS = 25 * 60;
const defaultState = { goals: [], habits: [], topics: [], notes: [], completedDates: [], focusSessions: 0 };
let state = loadState();
let timerSeconds = TIMER_SECONDS;
let timerId = null;

const goalForm = document.querySelector('#goalForm');
const habitForm = document.querySelector('#habitForm');
const topicForm = document.querySelector('#topicForm');
const noteForm = document.querySelector('#noteForm');
const goalList = document.querySelector('#goalList');
const habitList = document.querySelector('#habitList');
const topicList = document.querySelector('#topicList');
const noteList = document.querySelector('#noteList');
const timerDisplay = document.querySelector('#timerDisplay');
const timerStatus = document.querySelector('#timerStatus');
const overviewStrip = document.querySelector('.overview-strip');
const statsGrid = document.querySelector('.stats-grid');

statsGrid.parentNode.insertBefore(overviewStrip, statsGrid);

// All dashboard data lives in one object and is saved after every user action.
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return { ...defaultState };
    return {
      goals: Array.isArray(saved.goals) ? saved.goals.filter((item) => item && typeof item.text === 'string') : [],
      habits: Array.isArray(saved.habits) ? saved.habits.filter((item) => item && typeof item.text === 'string') : [],
      topics: Array.isArray(saved.topics) ? saved.topics.filter((item) => item && typeof item.text === 'string').map((item) => ({ ...item, progress: clamp(Number(item.progress) || 0) })) : [],
      notes: Array.isArray(saved.notes) ? saved.notes.filter((item) => item && typeof item.text === 'string') : [],
      completedDates: Array.isArray(saved.completedDates) ? saved.completedDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) : [],
      focusSessions: Number(saved.focusSessions) >= 0 ? Number(saved.focusSessions) : 0
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeId() {
  return crypto.randomUUID();
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function escapeHtml(text) {
  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function recordToday() {
  if (!state.completedDates.includes(todayKey())) state.completedDates.push(todayKey());
}

function currentStreak() {
  const completedDays = new Set(state.completedDates);
  const cursor = new Date();
  let streak = 0;
  while (completedDays.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function render() {
  const completedGoals = state.goals.filter((goal) => goal.completed).length;
  const completedHabits = state.habits.filter((habit) => habit.completed).length;
  const learningProgress = state.topics.length ? Math.round(state.topics.reduce((sum, topic) => sum + topic.progress, 0) / state.topics.length) : 0;
  const goalScore = state.goals.length ? (completedGoals / state.goals.length) * 30 : 0;
  const habitScore = state.habits.length ? (completedHabits / state.habits.length) * 25 : 0;
  const readinessScore = Math.round(goalScore + habitScore + learningProgress * 0.25 + Math.min(state.focusSessions, 5) * 4);
  document.querySelector('#goalsStat').textContent = completedGoals;
  document.querySelector('#habitsStat').textContent = state.habits.length;
  document.querySelector('#learningStat').textContent = `${learningProgress}%`;
  document.querySelector('#sessionsStat').textContent = state.focusSessions;
  document.querySelector('#sessionCount').textContent = state.focusSessions;
  document.querySelector('#streakStat').textContent = currentStreak();
  document.querySelector('#readinessScore').textContent = readinessScore;
  document.querySelector('#readinessRing').style.background = `conic-gradient(var(--accent) ${readinessScore * 3.6}deg, var(--accent-soft) 0deg)`;
  document.querySelector('#readinessRing').setAttribute('aria-label', `Daily progress ${readinessScore} percent`);
  document.querySelector('#smartMessage').textContent = getSmartMessage(completedGoals, state.goals.length, readinessScore);
  renderGoals();
  renderHabits();
  renderTopics();
  renderNotes();
  renderWeek();
}

function renderGoals() {
  goalList.innerHTML = state.goals.length ? state.goals.map((goal) => `<div class="goal-item ${goal.completed ? 'done' : ''}"><input type="checkbox" ${goal.completed ? 'checked' : ''} data-goal-id="${goal.id}" aria-label="Mark ${escapeHtml(goal.text)} complete"><span class="item-text">${escapeHtml(goal.text)}</span><button class="delete-item" data-delete-goal="${goal.id}" type="button" aria-label="Delete ${escapeHtml(goal.text)}">×</button></div>`).join('') : '<p class="empty-item"><strong>No goals yet.</strong> Create your first goal and start your day.</p>';
}

function renderHabits() {
  habitList.innerHTML = state.habits.length ? state.habits.map((habit) => `<div class="habit-item ${habit.completed ? 'done' : ''}"><input type="checkbox" ${habit.completed ? 'checked' : ''} data-habit-id="${habit.id}" aria-label="Mark ${escapeHtml(habit.text)} complete today"><span class="item-text">${escapeHtml(habit.text)}</span><small class="habit-tag">TODAY</small><button class="delete-item" data-delete-habit="${habit.id}" type="button" aria-label="Delete ${escapeHtml(habit.text)}">×</button></div>`).join('') : '<p class="empty-item"><strong>No habits yet.</strong> Add a habit to track today.</p>';
}

function renderTopics() {
  topicList.innerHTML = state.topics.length ? state.topics.map((topic) => `<div class="topic-item"><span class="topic-name">${escapeHtml(topic.text)}</span><div class="topic-progress"><span style="width:${topic.progress}%"></span></div><strong class="topic-percent">${topic.progress}%</strong><div class="topic-controls"><label class="sr-only" for="progress-${topic.id}">Update ${escapeHtml(topic.text)} progress</label><input id="progress-${topic.id}" type="number" min="0" max="100" value="${topic.progress}"><button type="button" data-update-topic="${topic.id}">Update</button><button type="button" data-delete-topic="${topic.id}">Delete</button></div></div>`).join('') : '<p class="empty-item"><strong>No learning topics yet.</strong> Add something you are exploring.</p>';
}

function renderNotes() {
  noteList.innerHTML = state.notes.length ? state.notes.map((note) => `<article class="note-item"><p>${escapeHtml(note.text)}</p><footer><span>${note.updatedAt}</span><span><button type="button" data-edit-note="${note.id}">Edit</button> <button type="button" data-delete-note="${note.id}">Delete</button></span></footer></article>`).join('') : '';
}

function renderWeek() {
  const bars = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - offset);
    const key = todayKey(day);
    const label = day.toLocaleDateString('en-IN', { weekday: 'long' });
    const value = state.completedDates.includes(key) ? 100 : 0;
    bars.push(`<div class="week-day"><div class="week-bar ${offset === 0 ? 'today' : ''}" style="height:${value}%" title="${value ? 'Completed' : 'No completion recorded'}"></div><span>${label}</span></div>`);
  }
  document.querySelector('#weekBars').innerHTML = bars.join('');
}

function getSmartMessage(completedGoals, totalGoals, score) {
  if (score === 0) return 'Your day is ready. Start with one small goal.';
  if (totalGoals > 0 && completedGoals === totalGoals) return "Today's goals are complete. Excellent consistency.";
  return 'Good start. Keep building your momentum.';
}

function formValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = formValue('goalInput');
  if (!text) return showError('#goalError', 'Please enter a goal.');
  state.goals.push({ id: makeId(), text, completed: false });
  goalForm.reset(); showError('#goalError', ''); saveState(); render();
});

goalList.addEventListener('change', (event) => {
  const goal = state.goals.find((item) => item.id === event.target.dataset.goalId);
  if (!goal) return;
  goal.completed = event.target.checked;
  if (goal.completed) recordToday();
  saveState(); render();
});

goalList.addEventListener('click', (event) => {
  const id = event.target.dataset.deleteGoal;
  if (!id) return;
  state.goals = state.goals.filter((goal) => goal.id !== id); saveState(); render();
});

habitForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = formValue('habitInput');
  if (!text) return showError('#habitError', 'Please enter a habit.');
  state.habits.push({ id: makeId(), text, completed: false });
  habitForm.reset(); showError('#habitError', ''); saveState(); render();
});

habitList.addEventListener('change', (event) => {
  const habit = state.habits.find((item) => item.id === event.target.dataset.habitId);
  if (!habit) return;
  habit.completed = event.target.checked;
  if (habit.completed) recordToday();
  saveState(); render();
});

habitList.addEventListener('click', (event) => {
  const id = event.target.dataset.deleteHabit;
  if (!id) return;
  state.habits = state.habits.filter((habit) => habit.id !== id); saveState(); render();
});

topicForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = formValue('topicInput');
  const progress = Number(document.querySelector('#topicProgress').value);
  if (!text) return showError('#topicError', 'Please enter a learning topic.');
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) return showError('#topicError', 'Progress must be between 0 and 100.');
  state.topics.push({ id: makeId(), text, progress: Math.round(progress) });
  topicForm.reset(); document.querySelector('#topicProgress').value = 0; showError('#topicError', ''); saveState(); render();
});

topicList.addEventListener('click', (event) => {
  const updateId = event.target.dataset.updateTopic;
  const deleteId = event.target.dataset.deleteTopic;
  if (deleteId) state.topics = state.topics.filter((topic) => topic.id !== deleteId);
  if (updateId) {
    const topic = state.topics.find((item) => item.id === updateId);
    const input = document.querySelector(`#progress-${updateId}`);
    const progress = Number(input.value);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) return;
    topic.progress = Math.round(progress);
  }
  saveState(); render();
});

noteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = formValue('noteInput');
  if (!text) return showError('#noteError', 'Please write a note before saving.');
  const editingId = noteForm.dataset.editingId;
  const stamp = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (editingId) {
    const note = state.notes.find((item) => item.id === editingId);
    if (note) { note.text = text; note.updatedAt = stamp; }
    delete noteForm.dataset.editingId;
  } else state.notes.unshift({ id: makeId(), text, updatedAt: stamp });
  noteForm.reset(); document.querySelector('.note-save').innerHTML = 'Save note <b>+</b>'; showError('#noteError', ''); saveState(); render();
});

noteList.addEventListener('click', (event) => {
  const editId = event.target.dataset.editNote;
  const deleteId = event.target.dataset.deleteNote;
  if (deleteId) state.notes = state.notes.filter((note) => note.id !== deleteId);
  if (editId) {
    const note = state.notes.find((item) => item.id === editId);
    document.querySelector('#noteInput').value = note.text;
    noteForm.dataset.editingId = editId;
    document.querySelector('.note-save').innerHTML = 'Update note <b>↗</b>';
    document.querySelector('#noteInput').focus();
    return;
  }
  saveState(); render();
});

function showError(selector, message) { document.querySelector(selector).textContent = message; }

document.querySelectorAll('[data-focus-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.dataset.focusTarget);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof target.focus === 'function') target.focus();
  });
});

function updateTimer() {
  timerDisplay.textContent = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`;
}

document.querySelector('#startTimer').addEventListener('click', () => {
  if (timerId) return;
  timerStatus.textContent = 'FOCUSING';
  timerId = setInterval(() => {
    timerSeconds -= 1; updateTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerId); timerId = null; state.focusSessions += 1; timerStatus.textContent = 'COMPLETE'; timerSeconds = TIMER_SECONDS; saveState(); render(); updateTimer();
    }
  }, 1000);
});
document.querySelector('#pauseTimer').addEventListener('click', () => { clearInterval(timerId); timerId = null; timerStatus.textContent = 'PAUSED'; });
document.querySelector('#resetTimer').addEventListener('click', () => { clearInterval(timerId); timerId = null; timerSeconds = TIMER_SECONDS; timerStatus.textContent = 'READY'; updateTimer(); });

document.querySelector('#themeToggle').addEventListener('click', () => {
  const light = document.body.classList.toggle('light-theme');
  document.querySelector('#themeToggle').textContent = light ? '◑' : '◐';
  document.querySelector('#themeToggle').setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  localStorage.setItem('army-ready-theme', light ? 'light' : 'dark');
});

const today = new Date();
document.querySelector('#todayLabel').textContent = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
document.querySelector('#heroDay').textContent = String(today.getDate()).padStart(2, '0');
const savedTheme = localStorage.getItem('army-ready-theme');
if (savedTheme === 'light') { document.body.classList.add('light-theme'); document.querySelector('#themeToggle').textContent = '◑'; }
updateTimer();
render();
