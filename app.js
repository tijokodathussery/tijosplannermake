/* ==========================================================================
   Tijo's Planner — Core Application Logic
   Premium Personal Expense Tracker
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Constants & Configuration ──────────────────────────────────────────
  const STORAGE_KEYS = {
    EXPENSES: 'tijosplanner_expenses',
    CATEGORIES: 'tijosplanner_categories',
    PAYMENT_MODES: 'tijosplanner_payment_modes',
    THEME: 'tijosplanner_theme',
    CURRENCY: 'tijosplanner_currency'
  };

  const DEFAULT_CATEGORIES = [
    'Food', 'Transport', 'Utilities', 'Entertainment',
    'Shopping', 'Health', 'Education', 'Rent'
  ];

  const DEFAULT_PAYMENT_MODES = [
    'Bank Account', 'Credit Card', 'UPI', 'Cash'
  ];

  const CHART_COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f43f5e', // Rose
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#ff7849', // Orange
    '#3b82f6', // Blue
    '#14b8a6', // Teal
    '#e879f9', // Pink
    '#fbbf24'  // Yellow
  ];

  // ─── Application State ──────────────────────────────────────────────────
  let state = {
    expenses: [],
    categories: [],
    paymentModes: [],
    currentTheme: 'dark',
    currentCurrency: 'INR',
    currencySymbol: '₹',
    filters: {
      search: '',
      category: ''
    }
  };

  let expenseChartInstance = null;
  let modalTargetSelect = null;

  // ─── DOM Element References ─────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const els = {
    themeToggle: $('themeToggle'),
    currencySelector: $('currencySelector'),
    amountCurrencySymbol: $('amountCurrencySymbol'),
    expenseForm: $('expenseForm'),
    expenseDate: $('expenseDate'),
    expenseAmount: $('expenseAmount'),
    expenseCategory: $('expenseCategory'),
    expensePaymentMode: $('expensePaymentMode'),
    expenseRemarks: $('expenseRemarks'),
    submitBtn: $('submitBtn'),
    submitBtnText: $('submitBtnText'),
    statTotal: $('statTotal'),
    statAverage: $('statAverage'),
    statTopCategory: $('statTopCategory'),
    entriesBody: $('entriesBody'),
    searchInput: $('searchInput'),
    categoryFilter: $('categoryFilter'),
    tableEmptyState: $('tableEmptyState'),
    chartEmptyMessage: $('chartEmptyMessage'),
    chartLegend: $('chartLegend'),
    importCsvBtn: $('importCsvBtn'),
    importCsvInput: $('importCsvInput'),
    exportCsvBtn: $('exportCsvBtn'),
    customModal: $('customOptionModal'),
    modalTitle: $('modalTitle'),
    modalInputLabel: $('modalInputLabel'),
    modalInput: $('customOptionInput'),
    customOptionForm: $('customOptionForm'),
    closeModalBtn: $('closeModalBtn'),
    cancelModalBtn: $('cancelModalBtn'),
    modalError: $('modalError'),
    successToast: $('successToast'),
    toastMessage: $('toastMessage')
  };

  // ─── Initialization ─────────────────────────────────────────────────────
  init();

  function init() {
    loadTheme();
    loadCurrency();
    loadState();
    setDefaultDate();
    renderDropdowns();
    renderCategoryFilter();
    updateDashboard();
    bindEvents();
  }

  // ─── Theme Controller ──────────────────────────────────────────────────
  function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    state.currentTheme = saved || (systemDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', state.currentTheme);
  }

  function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.currentTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, state.currentTheme);
    if (expenseChartInstance) renderChart();
  }

  // ─── Currency Controller ───────────────────────────────────────────────
  function loadCurrency() {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    state.currentCurrency = saved || 'INR';
    els.currencySelector.value = state.currentCurrency;
    updateCurrencySymbol();
  }

  function updateCurrencySymbol() {
    const opt = els.currencySelector.querySelector(`option[value="${state.currentCurrency}"]`);
    state.currencySymbol = opt ? opt.dataset.symbol : '₹';
    if (els.amountCurrencySymbol) {
      els.amountCurrencySymbol.textContent = state.currencySymbol;
    }
  }

  function handleCurrencyChange(e) {
    state.currentCurrency = e.target.value;
    localStorage.setItem(STORAGE_KEYS.CURRENCY, state.currentCurrency);
    updateCurrencySymbol();
    updateDashboard();
  }

  // ─── State Management ──────────────────────────────────────────────────
  function loadState() {
    const savedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const savedPaymentModes = localStorage.getItem(STORAGE_KEYS.PAYMENT_MODES);

    // Initial demo data for first-time users
    const demoExpenses = [
      {
        id: Date.now() - 86400000,
        date: dateToString(new Date(Date.now() - 86400000)),
        amount: 450,
        category: 'Food',
        paymentMode: 'UPI',
        remarks: 'Dinner at restaurant'
      },
      {
        id: Date.now() - 43200000,
        date: dateToString(new Date()),
        amount: 120,
        category: 'Transport',
        paymentMode: 'Cash',
        remarks: 'Auto rickshaw'
      },
      {
        id: Date.now() - 172800000,
        date: dateToString(new Date(Date.now() - 172800000)),
        amount: 1200,
        category: 'Utilities',
        paymentMode: 'Bank Account',
        remarks: 'Internet bill'
      },
      {
        id: Date.now() - 21600000,
        date: dateToString(new Date()),
        amount: 350,
        category: 'Entertainment',
        paymentMode: 'Credit Card',
        remarks: 'Movie tickets'
      }
    ];

    state.expenses = savedExpenses ? JSON.parse(savedExpenses) : demoExpenses;
    if (!savedExpenses) saveExpenses();

    state.categories = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
    state.paymentModes = savedPaymentModes ? JSON.parse(savedPaymentModes) : DEFAULT_PAYMENT_MODES;
  }

  function saveExpenses() {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses));
  }

  function saveCategories() {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
  }

  function savePaymentModes() {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_MODES, JSON.stringify(state.paymentModes));
  }

  function setDefaultDate() {
    els.expenseDate.value = dateToString(new Date());
  }

  // ─── UI Rendering ──────────────────────────────────────────────────────
  function renderDropdowns() {
    populateSelect(els.expenseCategory, state.categories, 'Select Category', '+ Add New Category...');
    populateSelect(els.expensePaymentMode, state.paymentModes, 'Select Payment Mode', '+ Add New Payment Mode...');
  }

  function populateSelect(selectEl, items, defaultText, addNewText) {
    const currentVal = selectEl.value;
    selectEl.innerHTML = '';

    // Default disabled option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = defaultText;
    defaultOpt.disabled = true;
    defaultOpt.selected = !currentVal;
    selectEl.appendChild(defaultOpt);

    // Regular items
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      if (currentVal && item === currentVal) opt.selected = true;
      selectEl.appendChild(opt);
    });

    // "Add New" option
    const addOpt = document.createElement('option');
    addOpt.value = '__add_new__';
    addOpt.textContent = addNewText;
    selectEl.appendChild(addOpt);
  }

  function renderCategoryFilter() {
    const currentVal = els.categoryFilter.value;
    els.categoryFilter.innerHTML = '<option value="">All Categories</option>';
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      if (currentVal && cat === currentVal) opt.selected = true;
      els.categoryFilter.appendChild(opt);
    });
  }

  // ─── Dashboard Updater ─────────────────────────────────────────────────
  function updateDashboard() {
    calculateStatistics();
    renderExpensesTable();
    renderChart();
    renderChartLegend();
  }

  function calculateStatistics() {
    const total = state.expenses.reduce((sum, item) => sum + item.amount, 0);

    // Animate stats update
    animateStatValue(els.statTotal, formatCurrency(total));

    const uniqueDates = new Set(state.expenses.map(item => item.date));
    const average = uniqueDates.size > 0 ? total / uniqueDates.size : 0;
    animateStatValue(els.statAverage, formatCurrency(average));

    // Top category
    const categoryTotals = {};
    state.expenses.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });

    let topCat = '—';
    let maxAmount = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        topCat = cat;
      }
    }
    animateStatValue(els.statTopCategory, topCat);
  }

  function animateStatValue(el, newValue) {
    if (el.textContent !== newValue) {
      el.textContent = newValue;
      el.classList.add('updating');
      setTimeout(() => el.classList.remove('updating'), 350);
    }
  }

  // ─── Chart Rendering ───────────────────────────────────────────────────
  function getCategoryAggregatedData() {
    const dataMap = {};
    state.expenses.forEach(item => {
      dataMap[item.category] = (dataMap[item.category] || 0) + item.amount;
    });

    const labels = [];
    const data = [];
    for (const [cat, amt] of Object.entries(dataMap)) {
      if (amt > 0) {
        labels.push(cat);
        data.push(Number(amt.toFixed(2)));
      }
    }
    return { labels, data };
  }

  function renderChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const { labels, data } = getCategoryAggregatedData();

    if (data.length === 0) {
      els.chartEmptyMessage.style.opacity = '1';
      els.chartEmptyMessage.style.pointerEvents = 'auto';
      if (expenseChartInstance) {
        expenseChartInstance.destroy();
        expenseChartInstance = null;
      }
      return;
    }

    els.chartEmptyMessage.style.opacity = '0';
    els.chartEmptyMessage.style.pointerEvents = 'none';

    const isDark = state.currentTheme === 'dark';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipText = isDark ? '#f8fafc' : '#0f172a';
    const tooltipBody = isDark ? '#94a3b8' : '#64748b';
    const tooltipBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

    const chartConfig = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: CHART_COLORS.slice(0, labels.length),
          borderWidth: isDark ? 2 : 1.5,
          borderColor: isDark ? '#111827' : '#ffffff',
          hoverOffset: 8,
          hoverBorderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: tooltipText,
            bodyColor: tooltipBody,
            borderColor: tooltipBorder,
            borderWidth: 1,
            padding: 14,
            boxPadding: 6,
            cornerRadius: 10,
            titleFont: { family: 'Outfit', weight: 'bold', size: 13 },
            bodyFont: { family: 'Inter', size: 12 },
            callbacks: {
              label: function(context) {
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return ` ${state.currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeOutQuart'
        }
      }
    };

    if (expenseChartInstance) {
      expenseChartInstance.data.labels = labels;
      expenseChartInstance.data.datasets[0].data = data;
      expenseChartInstance.data.datasets[0].backgroundColor = CHART_COLORS.slice(0, labels.length);
      expenseChartInstance.data.datasets[0].borderColor = isDark ? '#111827' : '#ffffff';
      expenseChartInstance.options.plugins.tooltip.backgroundColor = tooltipBg;
      expenseChartInstance.options.plugins.tooltip.titleColor = tooltipText;
      expenseChartInstance.options.plugins.tooltip.bodyColor = tooltipBody;
      expenseChartInstance.options.plugins.tooltip.borderColor = tooltipBorder;
      expenseChartInstance.update('active');
    } else {
      expenseChartInstance = new Chart(ctx, chartConfig);
    }
  }

  function renderChartLegend() {
    const { labels, data } = getCategoryAggregatedData();
    const total = data.reduce((a, b) => a + b, 0);

    if (labels.length === 0) {
      els.chartLegend.innerHTML = '';
      return;
    }

    els.chartLegend.innerHTML = labels.map((label, i) => {
      const pct = total > 0 ? ((data[i] / total) * 100).toFixed(0) : 0;
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
          <span class="legend-label">${label}</span>
          <span class="legend-value">${pct}%</span>
        </div>
      `;
    }).join('');
  }

  // ─── Transactions Table ────────────────────────────────────────────────
  function renderExpensesTable() {
    const filtered = getFilteredExpenses();

    if (filtered.length === 0) {
      els.entriesBody.innerHTML = '';
      els.tableEmptyState.style.display = 'flex';
      document.querySelector('.entries-wrapper').style.display = 'none';
      return;
    }

    els.tableEmptyState.style.display = 'none';
    document.querySelector('.entries-wrapper').style.display = 'block';

    const currentIds = Array.from(els.entriesBody.querySelectorAll('tr')).map(tr => tr.dataset.id);
    const targetIds = filtered.map(item => item.id.toString());

    // Remove rows no longer matching
    currentIds.forEach(id => {
      if (!targetIds.includes(id)) {
        const row = els.entriesBody.querySelector(`tr[data-id="${id}"]`);
        if (row) row.remove();
      }
    });

    // Build/update rows
    filtered.forEach((item, index) => {
      const existing = els.entriesBody.querySelector(`tr[data-id="${item.id}"]`);
      const rowHtml = buildRowHtml(item);

      if (existing) {
        if (existing.innerHTML !== rowHtml) {
          existing.innerHTML = rowHtml;
        }
      } else {
        const newRow = document.createElement('tr');
        newRow.dataset.id = item.id;
        newRow.innerHTML = rowHtml;
        newRow.classList.add('row-enter');

        if (index === 0) {
          els.entriesBody.insertBefore(newRow, els.entriesBody.firstChild);
        } else {
          const siblings = Array.from(els.entriesBody.children);
          els.entriesBody.insertBefore(newRow, siblings[index] || null);
        }
      }
    });
  }

  function buildRowHtml(item) {
    return `
      <td class="row-date">${formatDate(item.date)}</td>
      <td>
        <div class="cell-details-wrapper">
          <span class="row-category">${item.category}</span>
          <div class="row-sub-details">
            <span class="payment-tag">${item.paymentMode}</span>
            ${item.remarks ? `<span class="row-remarks" title="${escapeHtml(item.remarks)}">${escapeHtml(item.remarks)}</span>` : ''}
          </div>
        </div>
      </td>
      <td class="row-amount text-right">${formatCurrency(item.amount)}</td>
      <td class="text-center">
        <button class="btn-delete" data-id="${item.id}" aria-label="Delete entry" title="Delete transaction">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </td>
    `;
  }

  function getFilteredExpenses() {
    return state.expenses.filter(item => {
      const matchCat = !state.filters.category || item.category === state.filters.category;
      const q = state.filters.search.toLowerCase();
      const matchSearch = !q ||
        (item.remarks && item.remarks.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        item.paymentMode.toLowerCase().includes(q) ||
        item.date.includes(q);
      return matchCat && matchSearch;
    });
  }

  // ─── Form Handling ─────────────────────────────────────────────────────
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const newExpense = {
      id: Date.now(),
      date: els.expenseDate.value,
      amount: parseFloat(els.expenseAmount.value),
      category: els.expenseCategory.value,
      paymentMode: els.expensePaymentMode.value,
      remarks: els.expenseRemarks.value.trim()
    };

    state.expenses.unshift(newExpense);
    saveExpenses();
    updateDashboard();

    // Success animation
    showSuccessAnimation();
    showToast('Transaction logged successfully!');

    // Reset form
    els.expenseForm.reset();
    setDefaultDate();
    clearValidationErrors();
  }

  function validateForm() {
    let isValid = true;

    if (!els.expenseDate.value) {
      showFieldError(els.expenseDate, 'errorDate');
      isValid = false;
    } else {
      hideFieldError(els.expenseDate, 'errorDate');
    }

    const amt = parseFloat(els.expenseAmount.value);
    if (isNaN(amt) || amt <= 0) {
      showFieldError(els.expenseAmount, 'errorAmount');
      isValid = false;
    } else {
      hideFieldError(els.expenseAmount, 'errorAmount');
    }

    if (!els.expenseCategory.value || els.expenseCategory.value === '__add_new__') {
      showFieldError(els.expenseCategory, 'errorCategory');
      isValid = false;
    } else {
      hideFieldError(els.expenseCategory, 'errorCategory');
    }

    if (!els.expensePaymentMode.value || els.expensePaymentMode.value === '__add_new__') {
      showFieldError(els.expensePaymentMode, 'errorPaymentMode');
      isValid = false;
    } else {
      hideFieldError(els.expensePaymentMode, 'errorPaymentMode');
    }

    return isValid;
  }

  function showFieldError(inputEl) {
    inputEl.closest('.form-group').classList.add('has-error');
  }

  function hideFieldError(inputEl) {
    inputEl.closest('.form-group').classList.remove('has-error');
  }

  function clearValidationErrors() {
    els.expenseForm.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  }

  function showSuccessAnimation() {
    els.submitBtn.classList.add('btn-success-flash');
    const originalText = els.submitBtnText.textContent;
    els.submitBtnText.textContent = '✓ Logged!';

    setTimeout(() => {
      els.submitBtn.classList.remove('btn-success-flash');
      els.submitBtnText.textContent = originalText;
    }, 1200);
  }

  // ─── Toast Notification ────────────────────────────────────────────────
  function showToast(message) {
    els.toastMessage.textContent = message;
    els.successToast.classList.add('is-visible');
    setTimeout(() => {
      els.successToast.classList.remove('is-visible');
    }, 2500);
  }

  // ─── Delete Handler ────────────────────────────────────────────────────
  function handleDeleteClick(e) {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;

    const id = parseInt(btn.dataset.id);
    const row = els.entriesBody.querySelector(`tr[data-id="${id}"]`);

    if (row) {
      row.classList.add('row-exit');
      row.addEventListener('animationend', () => {
        state.expenses = state.expenses.filter(item => item.id !== id);
        saveExpenses();
        updateDashboard();
      }, { once: true });
    }
  }

  // ─── Modal Controller ──────────────────────────────────────────────────
  function openModal(type) {
    modalTargetSelect = type;
    els.modalError.classList.remove('is-visible');
    els.modalInput.value = '';

    if (type === 'category') {
      els.modalTitle.textContent = 'Add New Category';
      els.modalInputLabel.textContent = 'Category Name';
      els.modalInput.placeholder = 'e.g. Subscriptions, Gifts';
    } else {
      els.modalTitle.textContent = 'Add New Payment Mode';
      els.modalInputLabel.textContent = 'Payment Mode Name';
      els.modalInput.placeholder = 'e.g. Apple Pay, Google Pay';
    }

    els.customModal.classList.add('is-open');
    els.customModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => els.modalInput.focus(), 100);
  }

  function closeModal() {
    els.customModal.classList.remove('is-open');
    els.customModal.setAttribute('aria-hidden', 'true');

    if (els.expenseCategory.value === '__add_new__') els.expenseCategory.value = '';
    if (els.expensePaymentMode.value === '__add_new__') els.expensePaymentMode.value = '';
    modalTargetSelect = null;
  }

  function handleModalSubmit(e) {
    e.preventDefault();
    const raw = els.modalInput.value.trim();
    if (!raw) return;

    const cleanValue = raw.charAt(0).toUpperCase() + raw.slice(1);

    if (modalTargetSelect === 'category') {
      if (state.categories.some(c => c.toLowerCase() === cleanValue.toLowerCase())) {
        showModalError('This category already exists.');
        return;
      }
      state.categories.push(cleanValue);
      saveCategories();
      renderDropdowns();
      renderCategoryFilter();
      els.expenseCategory.value = cleanValue;
    } else if (modalTargetSelect === 'paymentMode') {
      if (state.paymentModes.some(p => p.toLowerCase() === cleanValue.toLowerCase())) {
        showModalError('This payment mode already exists.');
        return;
      }
      state.paymentModes.push(cleanValue);
      savePaymentModes();
      renderDropdowns();
      els.expensePaymentMode.value = cleanValue;
    }

    closeModal();
    showToast(`"${cleanValue}" added successfully!`);
  }

  function showModalError(msg) {
    els.modalError.textContent = msg;
    els.modalError.classList.add('is-visible');
    els.modalInput.focus();
  }

  // ─── CSV Export ────────────────────────────────────────────────────────
  function exportToCsv() {
    if (state.expenses.length === 0) {
      showToast('No expenses to export.');
      return;
    }

    const csvData = state.expenses.map(item => ({
      Date: item.date,
      [`Amount (${state.currencySymbol})`]: item.amount.toFixed(2),
      Category: item.category,
      'Payment Mode': item.paymentMode,
      Remarks: item.remarks || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Tijos_Planner_Export_${timestamp}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Expenses exported to CSV!');
  }

  // ─── CSV Import ────────────────────────────────────────────────────────
  function handleCsvImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.errors.length > 0) {
          showToast('Error parsing CSV file.');
          return;
        }

        const rows = results.data;
        if (rows.length === 0) {
          showToast('CSV file is empty.');
          return;
        }

        const imported = [];
        const newCats = new Set();
        const newModes = new Set();

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const headers = Object.keys(row);

          // Find columns flexibly
          const dateKey = headers.find(h => h.toLowerCase().includes('date'));
          const amtKey = headers.find(h => h.toLowerCase().includes('amount'));
          const catKey = headers.find(h => h.toLowerCase().includes('category'));
          const modeKey = headers.find(h => h.toLowerCase().includes('payment') || h.toLowerCase().includes('mode'));
          const remarkKey = headers.find(h => h.toLowerCase().includes('remark') || h.toLowerCase().includes('note'));

          if (!dateKey || !amtKey || !catKey || !modeKey) {
            showToast('CSV missing required columns (Date, Amount, Category, Payment Mode).');
            return;
          }

          const rawDate = row[dateKey];
          const rawAmount = row[amtKey];
          const rawCat = row[catKey];
          const rawMode = row[modeKey];
          const rawRemark = remarkKey ? row[remarkKey] : '';

          // Parse date
          let dateStr = '';
          const dateMatch = rawDate.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
          if (dateMatch) {
            dateStr = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
          } else {
            const parsed = new Date(rawDate);
            if (isNaN(parsed.getTime())) continue;
            dateStr = dateToString(parsed);
          }

          // Parse amount
          const cleanAmt = rawAmount.replace(/[^\d.-]/g, '');
          const amount = parseFloat(cleanAmt);
          if (isNaN(amount) || amount <= 0) continue;

          if (!rawCat || !rawMode) continue;

          const cleanCat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
          const cleanMode = rawMode.charAt(0).toUpperCase() + rawMode.slice(1);

          newCats.add(cleanCat);
          newModes.add(cleanMode);

          imported.push({
            id: Date.now() + i,
            date: dateStr,
            amount: Number(amount.toFixed(2)),
            category: cleanCat,
            paymentMode: cleanMode,
            remarks: rawRemark || ''
          });
        }

        if (imported.length === 0) {
          showToast('No valid rows found in CSV.');
          return;
        }

        // Register new categories/modes
        let catsAdded = 0, modesAdded = 0;
        newCats.forEach(cat => {
          if (!state.categories.some(c => c.toLowerCase() === cat.toLowerCase())) {
            state.categories.push(cat);
            catsAdded++;
          }
        });
        if (catsAdded > 0) saveCategories();

        newModes.forEach(mode => {
          if (!state.paymentModes.some(m => m.toLowerCase() === mode.toLowerCase())) {
            state.paymentModes.push(mode);
            modesAdded++;
          }
        });
        if (modesAdded > 0) savePaymentModes();

        // Merge
        state.expenses = [...imported, ...state.expenses];
        state.expenses.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

        saveExpenses();
        renderDropdowns();
        renderCategoryFilter();
        updateDashboard();

        showToast(`Imported ${imported.length} transactions!`);
      },
      error: function() {
        showToast('Error reading CSV file.');
      }
    });

    els.importCsvInput.value = '';
  }

  // ─── Utility Functions ─────────────────────────────────────────────────
  function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: state.currentCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  }

  function formatDate(dateString) {
    const parts = dateString.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function dateToString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── Event Bindings ────────────────────────────────────────────────────
  function bindEvents() {
    // Theme
    els.themeToggle.addEventListener('click', toggleTheme);

    // Currency
    els.currencySelector.addEventListener('change', handleCurrencyChange);

    // Form
    els.expenseForm.addEventListener('submit', handleFormSubmit);

    // Remove validation errors on input
    els.expenseDate.addEventListener('input', () => hideFieldError(els.expenseDate));
    els.expenseAmount.addEventListener('input', () => hideFieldError(els.expenseAmount));
    els.expenseCategory.addEventListener('change', (e) => {
      if (e.target.value === '__add_new__') {
        openModal('category');
      } else {
        hideFieldError(els.expenseCategory);
      }
    });
    els.expensePaymentMode.addEventListener('change', (e) => {
      if (e.target.value === '__add_new__') {
        openModal('paymentMode');
      } else {
        hideFieldError(els.expensePaymentMode);
      }
    });

    // Filters
    els.searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value;
      renderExpensesTable();
    });

    els.categoryFilter.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      renderExpensesTable();
    });

    // Table delete delegation
    els.entriesBody.addEventListener('click', handleDeleteClick);

    // Modal
    els.closeModalBtn.addEventListener('click', closeModal);
    els.cancelModalBtn.addEventListener('click', closeModal);
    els.customOptionForm.addEventListener('submit', handleModalSubmit);
    els.customModal.addEventListener('click', (e) => {
      if (e.target === els.customModal) closeModal();
    });

    // ESC to close modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els.customModal.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Export/Import
    els.exportCsvBtn.addEventListener('click', exportToCsv);
    els.importCsvBtn.addEventListener('click', () => els.importCsvInput.click());
    els.importCsvInput.addEventListener('change', handleCsvImport);

    // Ripple effect on primary button
    els.submitBtn.addEventListener('mousedown', (e) => {
      const rect = els.submitBtn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      els.submitBtn.style.setProperty('--ripple-x', x + '%');
      els.submitBtn.style.setProperty('--ripple-y', y + '%');
      els.submitBtn.classList.remove('ripple');
      void els.submitBtn.offsetWidth; // Force reflow
      els.submitBtn.classList.add('ripple');
    });
  }

});
