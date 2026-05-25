// Database Initialization
const db = new Dexie("DenethFinanceAppDB");
db.version(1).stores({
    cashflow: '++id, type, description, amount, date',
    loans: '++id, friendName, amount, date, status'
});

// App State
let currentView = 'home';
let currentLoanTab = 'pending';

// ==== Theme Management ====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').className = 'fas fa-sun text-lg';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon').className = 'fas fa-moon text-lg';
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const icon = document.getElementById('theme-icon');
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        icon.className = 'fas fa-moon text-lg';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        icon.className = 'fas fa-sun text-lg';
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tx-date').value = today;
    document.getElementById('loan-date').value = today;
    
    // Initial Load
    initMonthFilters().then(() => {
        loadDashboard();
        loadCashflow();
        loadLoans();
    });
});

// ==== View Switching ====
function switchView(view) {
    currentView = view;
    const homeView = document.getElementById('home-view');
    const cashflowView = document.getElementById('cashflow-view');
    const loansView = document.getElementById('loans-view');
    
    const navHome = document.getElementById('nav-home');
    const navCashflow = document.getElementById('nav-cashflow');
    const navLoans = document.getElementById('nav-loans');

    // Reset all nav styles
    [navHome, navCashflow, navLoans].forEach(nav => {
        nav.className = "nav-btn flex-1 flex flex-col items-center text-slate-500 dark:text-gray-500 transition-colors btn-scale pt-2";
    });

    // Hide all views
    [homeView, cashflowView, loansView].forEach(v => v.classList.add('hidden'));

    if (view === 'home') {
        homeView.classList.remove('hidden');
        navHome.className = "nav-btn flex-1 flex flex-col items-center text-blue-600 dark:text-blue-400 transition-colors btn-scale pt-2";
        loadDashboard();
    } else if (view === 'cashflow') {
        cashflowView.classList.remove('hidden');
        navCashflow.className = "nav-btn flex-1 flex flex-col items-center text-blue-600 dark:text-blue-400 transition-colors btn-scale pt-2";
    } else if (view === 'loans') {
        loansView.classList.remove('hidden');
        navLoans.className = "nav-btn flex-1 flex flex-col items-center text-amber-600 dark:text-amber-400 transition-colors btn-scale pt-2";
    }
}

// ==== Filters & Shared Logic ====
async function initMonthFilters() {
    const cashflowRecords = await db.cashflow.toArray();
    const loanRecords = await db.loans.toArray();
    
    const months = new Set();
    
    cashflowRecords.forEach(r => {
        const monthStr = new Date(r.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        months.add(monthStr);
    });
    loanRecords.forEach(r => {
        const monthStr = new Date(r.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        months.add(monthStr);
    });

    const currentMonthStr = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    months.add(currentMonthStr);
    
    const sortedMonths = Array.from(months).sort((a, b) => new Date(b) - new Date(a));
    
    updateFilterOptions('month-filter', sortedMonths, currentMonthStr, true);
}

function updateFilterOptions(selectId, sortedMonths, defaultVal, addAllOption = false) {
    const select = document.getElementById(selectId);
    if(!select) return;
    
    const currentValue = select.value;
    
    let optionsHtml = '';
    if (addAllOption) {
        optionsHtml += '<option value="all">All Time</option>';
    }
    
    sortedMonths.forEach(m => {
        optionsHtml += `<option value="${m}">${m}</option>`;
    });
    
    select.innerHTML = optionsHtml;
    
    if (sortedMonths.includes(currentValue) || (addAllOption && currentValue === 'all')) {
        select.value = currentValue;
    } else {
        select.value = defaultVal;
    }
}

// ==== Dashboard Logic ====
async function loadDashboard() {
    let cashflowRecords = await db.cashflow.toArray();
    let loanRecords = await db.loans.where('status').equals('pending').toArray();

    let totalInc = 0;
    let totalExp = 0;
    
    cashflowRecords.forEach(r => {
        if (r.type === 'income') totalInc += r.amount;
        else totalExp += r.amount;
    });

    const balance = totalInc - totalExp;
    
    let outstandingLoans = 0;
    loanRecords.forEach(r => {
        outstandingLoans += r.amount;
    });

    // Update UI
    const balanceEl = document.getElementById('home-balance');
    balanceEl.textContent = `Rs. ${balance.toLocaleString()}`;
    
    if (balance >= 0) {
        balanceEl.className = "text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2";
    } else {
        balanceEl.className = "text-3xl font-bold text-red-600 dark:text-red-400 mb-2";
    }

    document.getElementById('home-income').textContent = `Rs. ${totalInc.toLocaleString()}`;
    document.getElementById('home-expense').textContent = `Rs. ${totalExp.toLocaleString()}`;
    document.getElementById('home-outstanding').textContent = `Rs. ${outstandingLoans.toLocaleString()}`;
}

// ==== Cashflow Logic ====
function setTxType(type) {
    const btnInc = document.getElementById('btn-type-income');
    const btnExp = document.getElementById('btn-type-expense');
    document.getElementById('tx-type').value = type;

    if (type === 'income') {
        btnInc.className = "flex-1 py-2 rounded-xl text-sm font-medium transition-colors border border-emerald-500/50 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm";
        btnExp.className = "flex-1 py-2 rounded-xl text-sm font-medium transition-colors border border-red-500/50 text-red-500 dark:text-red-400 opacity-50 hover:bg-red-50 dark:hover:bg-red-500/10";
    } else {
        btnExp.className = "flex-1 py-2 rounded-xl text-sm font-medium transition-colors border border-red-500/50 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 shadow-sm";
        btnInc.className = "flex-1 py-2 rounded-xl text-sm font-medium transition-colors border border-emerald-500/50 text-emerald-500 dark:text-emerald-400 opacity-50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10";
    }
}

document.getElementById('form-cashflow').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('tx-type').value;
    const description = document.getElementById('tx-desc').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const date = document.getElementById('tx-date').value;

    if (!description || !amount || !date) return;

    await db.cashflow.add({ type, description, amount, date });
    
    document.getElementById('tx-desc').value = '';
    document.getElementById('tx-amount').value = '';
    
    await initMonthFilters();
    loadCashflow();
    if (currentView === 'home') loadDashboard();
});

async function loadCashflow() {
    const list = document.getElementById('cashflow-list');
    const selectedMonth = document.getElementById('month-filter').value;
    
    let records = await db.cashflow.orderBy('date').reverse().toArray();
    
    if (selectedMonth !== 'all') {
        records = records.filter(r => {
            const mStr = new Date(r.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
            return mStr === selectedMonth;
        });
    }

    list.innerHTML = '';
    let totalInc = 0;
    let totalExp = 0;

    if (records.length === 0) {
        list.innerHTML = `<div class="text-center text-slate-500 dark:text-gray-500 py-8 text-sm"><i class="fas fa-inbox text-3xl mb-3 opacity-50 block"></i>No records found</div>`;
    }

    records.forEach(r => {
        const isInc = r.type === 'income';
        if(isInc) totalInc += r.amount;
        else totalExp += r.amount;

        const icon = isInc ? '<i class="fas fa-arrow-down text-emerald-600 dark:text-emerald-400"></i>' : '<i class="fas fa-arrow-up text-red-600 dark:text-red-400"></i>';
        const amountColor = isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
        const sign = isInc ? '+' : '-';

        const item = document.createElement('div');
        item.className = 'glass-card !p-3 flex justify-between items-center';
        item.innerHTML = `
            <div class="flex items-center space-x-3 overflow-hidden">
                <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-black/5 dark:border-white/5 shrink-0">
                    ${icon}
                </div>
                <div class="truncate pr-2">
                    <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">${r.description}</p>
                    <p class="text-xs text-slate-500 dark:text-gray-400">${r.date}</p>
                </div>
            </div>
            <div class="text-right shrink-0">
                <p class="text-sm font-bold ${amountColor}">${sign}Rs. ${r.amount.toLocaleString()}</p>
                <button onclick="deleteCashflow(${r.id})" class="text-[10px] text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 mt-1 transition-colors"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(item);
    });

    document.getElementById('summary-income').textContent = `Rs. ${totalInc.toLocaleString()}`;
    document.getElementById('summary-expense').textContent = `Rs. ${totalExp.toLocaleString()}`;
}

async function deleteCashflow(id) {
    if(confirm('Are you sure you want to delete this record?')) {
        await db.cashflow.delete(id);
        await initMonthFilters();
        loadCashflow();
        if (currentView === 'home') loadDashboard();
    }
}

// ==== Loans Logic ====
function switchLoanTab(tab) {
    currentLoanTab = tab;
    const tabActive = document.getElementById('tab-active');
    const tabSettled = document.getElementById('tab-settled');
    
    if (tab === 'pending') {
        tabActive.className = "flex-1 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow transition-all";
        tabSettled.className = "flex-1 py-2 text-sm font-medium rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-all";
        document.getElementById('loan-summary-title').textContent = "Total Outstanding";
        document.getElementById('loan-summary-card').className = "glass-card !p-3 border border-amber-500/20 mb-4";
        document.getElementById('loan-summary-title').className = "text-xs text-amber-600 dark:text-amber-400 mb-1";
    } else {
        tabSettled.className = "flex-1 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow transition-all";
        tabActive.className = "flex-1 py-2 text-sm font-medium rounded-lg text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-all";
        document.getElementById('loan-summary-title').textContent = "Total Settled";
        document.getElementById('loan-summary-card').className = "glass-card !p-3 border border-emerald-500/20 mb-4";
        document.getElementById('loan-summary-title').className = "text-xs text-emerald-600 dark:text-emerald-400 mb-1";
    }
    
    loadLoans();
}

document.getElementById('form-loan').addEventListener('submit', async (e) => {
    e.preventDefault();
    const friendName = document.getElementById('loan-name').value.trim();
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const date = document.getElementById('loan-date').value;

    if (!friendName || !amount || !date) return;

    await db.loans.add({ friendName, amount, date, status: 'pending' });
    
    document.getElementById('loan-name').value = '';
    document.getElementById('loan-amount').value = '';
    
    await initMonthFilters();
    if (currentLoanTab !== 'pending') switchLoanTab('pending');
    else loadLoans();
    if (currentView === 'home') loadDashboard();
});

async function loadLoans() {
    const list = document.getElementById('loans-list');
    
    let records = await db.loans.where('status').equals(currentLoanTab).reverse().toArray();
    records.sort((a,b) => new Date(b.date) - new Date(a.date));

    list.innerHTML = '';
    let total = 0;

    if (records.length === 0) {
        list.innerHTML = `<div class="text-center text-slate-500 dark:text-gray-500 py-8 text-sm"><i class="fas fa-check-circle text-3xl mb-3 opacity-50 block"></i>No ${currentLoanTab} loans</div>`;
    }

    records.forEach(r => {
        total += r.amount;
        
        const isPending = r.status === 'pending';
        const colorClass = isPending ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
        const iconClass = isPending ? 'fa-clock' : 'fa-check-double';
        
        const item = document.createElement('div');
        item.className = 'glass-card !p-3 flex flex-col space-y-2';
        
        let actionBtn = '';
        if (isPending) {
            actionBtn = `
                <button onclick="settleLoan(${r.id})" class="mt-2 w-full py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium btn-scale transition-colors">
                    <i class="fas fa-check mr-1"></i> Mark as Recovered (Apahu Labuna)
                </button>
            `;
        }

        item.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-black/5 dark:border-white/5">
                        <i class="fas ${iconClass} ${colorClass}"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-800 dark:text-slate-200">${r.friendName}</p>
                        <p class="text-xs text-slate-500 dark:text-gray-400">${r.date}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold ${colorClass}">Rs. ${r.amount.toLocaleString()}</p>
                    <button onclick="deleteLoan(${r.id})" class="text-[10px] text-slate-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 mt-1 transition-colors"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            ${actionBtn}
        `;
        list.appendChild(item);
    });

    document.getElementById('loan-summary-amount').textContent = `Rs. ${total.toLocaleString()}`;
    const amountEl = document.getElementById('loan-summary-amount');
    if(currentLoanTab === 'pending') {
        amountEl.className = "text-lg font-bold text-amber-600 dark:text-amber-400";
    } else {
        amountEl.className = "text-lg font-bold text-emerald-600 dark:text-emerald-400";
    }
}

async function settleLoan(id) {
    await db.loans.update(id, { status: 'settled' });
    loadLoans();
    if (currentView === 'home') loadDashboard();
}

async function deleteLoan(id) {
    if(confirm('Are you sure you want to delete this record?')) {
        await db.loans.delete(id);
        await initMonthFilters();
        loadLoans();
        if (currentView === 'home') loadDashboard();
    }
}
