const STORAGE_KEY = 'spendwise-transactions';
const categories = ['Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Other'];
let transactions = loadTransactions();
let activeFilter = 'all';

const form = document.querySelector('#transactionForm');
const formError = document.querySelector('#formError');
const transactionList = document.querySelector('#transactionList');
const categoryChart = document.querySelector('#categoryChart');
const chartEmpty = document.querySelector('#chartEmpty');
const recentList = document.querySelector('#recentList');

// Read saved transactions safely. An invalid saved value starts with a clean list.
function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter(isValidSavedTransaction) : [];
  } catch {
    return [];
  }
}

function isValidSavedTransaction(item) {
  return item && typeof item.title === 'string' && Number(item.amount) > 0 && ['income', 'expense'].includes(item.type) && categories.includes(item.category) && isValidDate(item.date);
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  const [year, month, day] = value.split('-').map(Number);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(text) {
  const element = document.createElement('div');
  element.textContent = text;
  return element.innerHTML;
}

function render() {
  const income = transactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = transactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0);
  const visibleTransactions = activeFilter === 'all' ? transactions : transactions.filter((transaction) => transaction.type === activeFilter);
  const currentMonth = getTodayKey().slice(0, 7);
  const monthlyExpenses = transactions.filter((transaction) => transaction.type === 'expense' && transaction.date.slice(0, 7) === currentMonth).reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryTotals = getCategoryTotals();
  const topCategory = categoryTotals[0];

  document.querySelector('#totalBalance').textContent = formatCurrency(income - expenses);
  document.querySelector('#totalIncome').textContent = formatCurrency(income);
  document.querySelector('#totalExpenses').textContent = formatCurrency(expenses);
  document.querySelector('#transactionCount').textContent = transactions.length;
  document.querySelector('#monthlySpending').textContent = formatCurrency(monthlyExpenses);
  document.querySelector('#monthLabel').textContent = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date());
  document.querySelector('#topCategory').textContent = topCategory ? topCategory.category : 'No spending data yet.';
  document.querySelector('#smartMessage').textContent = getSmartMessage(topCategory);

  if (!visibleTransactions.length) {
    transactionList.innerHTML = transactions.length ? '<div class="empty-state"><strong>No matching transactions.</strong>Try another filter.</div>' : '<div class="empty-state"><strong>Your financial dashboard is ready.</strong>Add your first transaction to start tracking your spending.</div>';
  } else {
    transactionList.innerHTML = visibleTransactions.map((transaction) => `<div class="transaction-row"><strong class="transaction-title">${escapeHtml(transaction.title)}</strong><span class="transaction-category">${escapeHtml(transaction.category)}</span><time class="transaction-date" datetime="${transaction.date}">${formatDate(transaction.date)}</time><span class="transaction-amount ${transaction.type}-amount">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}<small class="type-pill ${transaction.type}">${transaction.type}</small></span><button class="delete-button" type="button" data-delete-id="${transaction.id}" aria-label="Delete ${escapeHtml(transaction.title)}" title="Delete transaction">×</button></div>`).join('');
  }

  renderChart();
  renderRecentActivity();
}

function renderChart() {
  const totals = getCategoryTotals();
  const expenseTotal = totals.reduce((sum, item) => sum + item.total, 0);
  const largestTotal = totals[0]?.total || 0;
  chartEmpty.classList.toggle('hidden', totals.length > 0);
  categoryChart.classList.toggle('hidden', totals.length === 0);
  categoryChart.innerHTML = totals.map((item) => `<div class="chart-row"><span class="chart-name">${item.category}</span><div class="chart-track"><span style="width: ${(item.total / largestTotal) * 100}%"></span></div><strong class="chart-amount">${formatCurrency(item.total)} <small class="chart-percent">${Math.round((item.total / expenseTotal) * 100)}%</small></strong></div>`).join('');
}

function getCategoryTotals() {
  return categories.map((category) => ({ category, total: transactions.filter((transaction) => transaction.type === 'expense' && transaction.category === category).reduce((sum, transaction) => sum + transaction.amount, 0) })).filter((item) => item.total > 0).sort((first, second) => second.total - first.total);
}

function getSmartMessage(topCategory) {
  if (!topCategory) return 'Start adding transactions to understand your spending.';
  return `${topCategory.category} is currently your largest spending category.`;
}

function renderRecentActivity() {
  const recentTransactions = transactions.slice(0, 5);
  recentList.innerHTML = recentTransactions.length ? recentTransactions.map((transaction) => `<div class="recent-item"><strong class="recent-item-title">${escapeHtml(transaction.title)}</strong><span class="recent-item-meta">${escapeHtml(transaction.category)} · ${formatDate(transaction.date)}</span><strong class="recent-item-amount ${transaction.type}">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}</strong></div>`).join('') : '<p class="recent-empty">Your recent activity will appear here after your first transaction.</p>';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.querySelector('#titleInput').value.trim();
  const amount = Number(document.querySelector('#amountInput').value);
  const type = document.querySelector('#typeInput').value;
  const category = document.querySelector('#categoryInput').value;
  const date = document.querySelector('#dateInput').value;

  if (!title) return showError('Please enter a transaction title.');
  if (!Number.isFinite(amount) || amount <= 0) return showError('Enter an amount greater than zero.');
  if (!['income', 'expense'].includes(type)) return showError('Choose a valid transaction type.');
  if (!categories.includes(category)) return showError('Please choose a category.');
  if (!isValidDate(date)) return showError('Please choose a valid date.');

  transactions.unshift({ id: crypto.randomUUID(), title, amount, type, category, date });
  saveTransactions();
  form.reset();
  document.querySelector('#dateInput').value = getTodayKey();
  showError('');
  render();
});

function showError(message) {
  formError.textContent = message;
}

transactionList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-id]');
  if (!button) return;
  transactions = transactions.filter((transaction) => transaction.id !== button.dataset.deleteId);
  saveTransactions();
  render();
});

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('active', item === button));
    render();
  });
});

document.querySelector('#themeToggle').addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-theme');
  document.querySelector('#themeToggle').textContent = isLight ? '◑' : '◐';
  document.querySelector('#themeToggle').setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
  localStorage.setItem('spendwise-theme', isLight ? 'light' : 'dark');
});

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function setHeaderDate() {
  const today = new Date();
  document.querySelector('#todayLabel').textContent = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.querySelector('#dayNumber').textContent = today.getDate();
  document.querySelector('#monthName').innerHTML = `${today.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}<br>${today.getFullYear()}`;
  document.querySelector('#dateInput').value = getTodayKey();
}

const savedTheme = localStorage.getItem('spendwise-theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-theme');
  document.querySelector('#themeToggle').textContent = '◑';
  document.querySelector('#themeToggle').setAttribute('aria-label', 'Switch to dark theme');
}
setHeaderDate();
render();
