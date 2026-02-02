// app.js

document.addEventListener('DOMContentLoaded', () => {

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registered'))
            .catch(err => console.error('SW Registration Failed:', err));
    }

    // --- Mock Inputs (Mic & Camera) ---
    const micBtn = document.getElementById('micInputBtn');
    const cameraBtn = document.getElementById('cameraInputBtn');

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            // Visual Feedback
            micBtn.style.color = '#EF5350'; // Red recording color
            micBtn.style.background = 'rgba(239, 83, 80, 0.1)';

            const originalPlaceholder = noteInput.placeholder;
            noteInput.placeholder = "Listening...";
            noteInput.value = "";

            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

            setTimeout(() => {
                // Simulate result
                noteInput.value = "Coffee with friends";
                noteInput.placeholder = originalPlaceholder;

                // Reset Button
                micBtn.style.color = '';
                micBtn.style.background = '';

                // Trigger feedback
                if (navigator.vibrate) navigator.vibrate(50);
            }, 1500);
        });
    }

    if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
            // Visual Feedback
            cameraBtn.style.color = '#42A5F5'; // Blue scanning color
            cameraBtn.style.background = 'rgba(66, 165, 245, 0.1)';

            // Simulate scanning overlay or just delay
            if (navigator.vibrate) navigator.vibrate(50);

            const originalVal = amountInput.value;
            amountInput.value = "Scanning...";

            setTimeout(() => {
                // Simulate result
                amountInput.value = "450.00";

                // Reset Button
                cameraBtn.style.color = '';
                cameraBtn.style.background = '';

                if (navigator.vibrate) navigator.vibrate([50, 100]);
            }, 1500);
        });
    }

    // --- State Management ---
    const loadState = () => {
        const saved = localStorage.getItem('boys_tracker_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Default categories if missing (migration)
            if (!parsed.categories) {
                parsed.categories = ['Food', 'Transport', 'Shopping', 'Ent'];
            }
            return parsed;
        }
        // Fallback or migration from old key
        const oldTx = localStorage.getItem('boys_tracker_transactions');
        return {
            budget: 200.00,
            transactions: oldTx ? JSON.parse(oldTx) : [],
            categories: ['Food', 'Transport', 'Shopping', 'Ent']
        };
    };

    const loadedData = loadState();

    const state = {
        budget: loadedData.budget || 200.00,
        currentView: 'daily',
        transactions: loadedData.transactions || [],
        categories: loadedData.categories || ['Food', 'Transport', 'Shopping', 'Ent'],
        editingId: null,
        showChartAmount: false // Toggle state for chart
    };

    // Initialize with data if empty and fresh
    if (!localStorage.getItem('boys_tracker_data') && !localStorage.getItem('boys_tracker_transactions')) {
        state.transactions = [];
    }

    const saveState = () => {
        const data = {
            transactions: state.transactions,
            budget: state.budget,
            categories: state.categories
        };
        localStorage.setItem('boys_tracker_data', JSON.stringify(data));
    };

    // --- DOM Elements ---
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const closeExpenseBtn = document.getElementById('closeExpenseBtn');
    const modal = document.getElementById('expenseModal');
    const saveExpenseBtn = document.getElementById('saveExpenseBtn');

    // Category Modal Elements
    const categoryModal = document.getElementById('categoryModal');
    const closeCategoryBtn = document.getElementById('closeCategoryBtn');
    const categoryModalTitle = document.getElementById('categoryModalTitle');
    const categoryTransactionList = document.getElementById('categoryTransactionList');

    // Dashboard Elements
    const totalSpentEl = document.querySelector('.amount-display');
    const budgetChartEl = document.querySelector('.circular-chart');
    const percentEl = document.querySelector('.inner-circle .percent');
    const percentLabelEl = document.querySelector('.inner-circle .label'); // Select label for updating

    // Views
    const homeView = document.getElementById('homeView');
    const statsView = document.getElementById('statsView');
    const budgetView = document.getElementById('budgetView');
    const settingsView = document.getElementById('settingsView');

    const transactionListEl = document.querySelector('#homeView .transaction-list');
    const statsListEl = document.getElementById('statsList');
    const emptyStateEl = document.querySelector('.empty-state');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const navItems = document.querySelectorAll('.nav-item');

    // Stats Elements
    const barChartEl = document.getElementById('barChart');

    // Budget Elements
    const budgetInput = document.getElementById('budgetInput');
    const saveBudgetBtn = document.getElementById('saveBudgetBtn');

    // Settings Elements
    const exportDataBtn = document.getElementById('exportDataBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const resetDataBtn = document.getElementById('resetDataBtn');
    const helpBtn = document.getElementById('helpBtn');

    // Input Elements
    const amountInput = document.querySelector('.amount-input');
    const noteInput = document.getElementById('expenseNote');
    const searchInput = document.getElementById('searchInput');
    const keys = document.querySelectorAll('.num-key');
    // NOTE: catChips selector removed, we use dynamic container
    const chipsContainer = document.querySelector('.category-grid');

    let selectedCategory = 'Food'; // Default
    let searchQuery = ''; // Search state

    // --- Helpers ---

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Compact formatter for chart to avoid overflow
    const formatCompact = (amount) => {
        if (amount >= 100000) { // 1 Lakh+
            return `₹${(amount / 100000).toFixed(1)}L`;
        }
        return `₹${Math.round(amount)}`;
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const isSameMonth = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth();
    };

    const isSameYear = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear();
    };

    const getFilteredTransactions = () => {
        const now = new Date();
        let filtered = state.transactions.filter(t => {
            const tDate = new Date(t.date);
            if (state.currentView === 'daily') return isSameDay(tDate, now);
            if (state.currentView === 'monthly') return isSameMonth(tDate, now);
            if (state.currentView === 'yearly') return isSameYear(tDate, now);
            return true;
        });

        // Apply Search Filter
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(lowerQuery) ||
                (t.note && t.note.toLowerCase().includes(lowerQuery)) ||
                t.category.toLowerCase().includes(lowerQuery)
            );
        }

        return filtered;
    };

    const getCategoryIcon = (cat) => {
        const lower = cat.toLowerCase();
        if (lower.includes('food') || lower.includes('eat') || lower.includes('lunch')) return 'restaurant';
        if (lower.includes('transport') || lower.includes('uber') || lower.includes('taxi')) return 'car-sport';
        if (lower.includes('shop') || lower.includes('buy')) return 'bag-handle';
        if (lower.includes('ent') || lower.includes('fun') || lower.includes('movie')) return 'ticket';
        if (lower.includes('bill') || lower.includes('util')) return 'receipt';
        if (lower.includes('health') || lower.includes('doctor')) return 'medkit';
        if (lower.includes('home') || lower.includes('rent')) return 'home';
        return 'pricetag';
    };

    // --- Dynamic Category Logic ---
    const renderCategories = () => {
        chipsContainer.innerHTML = '';
        state.categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'cat-chip';
            if (cat === selectedCategory) btn.classList.add('selected');
            btn.innerText = cat;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
                btn.classList.add('selected');
                selectedCategory = cat;
            });
            chipsContainer.appendChild(btn);
        });

        // Add "Add (+)" button
        const addBtn = document.createElement('button');
        addBtn.className = 'cat-chip add-cat-btn';
        addBtn.style.background = 'rgba(255,255,255,0.15)';
        addBtn.style.border = '1px dashed var(--text-secondary)';
        addBtn.style.color = 'var(--text-secondary)';
        addBtn.innerHTML = '<ion-icon name="add"></ion-icon>';

        addBtn.addEventListener('click', () => {
            const newCat = prompt("Enter new category name:");
            if (newCat && newCat.trim() !== "") {
                const name = newCat.trim();
                // Check duplicate
                if (!state.categories.includes(name)) {
                    state.categories.push(name);
                    selectedCategory = name; // Auto-select
                    saveState();
                    renderCategories();
                }
            }
        });

        chipsContainer.appendChild(addBtn);
    };

    const updateDashboard = () => {
        const filteredTx = getFilteredTransactions();
        const totalSpent = filteredTx.reduce((sum, t) => sum + t.amount, 0);

        totalSpentEl.innerHTML = `<span class="currency">₹</span>${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        let currentBudget = state.budget;
        let budgetLabel = "Daily Budget";

        if (state.currentView === 'monthly') {
            currentBudget = state.budget * 30; // Approx
            budgetLabel = "Monthly Budget";
        } else if (state.currentView === 'yearly') {
            currentBudget = state.budget * 365;
            budgetLabel = "Yearly Budget";
        }

        document.querySelector('.sub-label').innerText = `${budgetLabel}: ${formatCurrency(currentBudget)}`;

        let percentage = Math.round((totalSpent / currentBudget) * 100);
        if (isNaN(percentage) || !isFinite(percentage)) percentage = 0;
        if (percentage > 100) percentage = 100;

        budgetChartEl.style.setProperty('--percentage', percentage);

        // Toggle Logic for Chart Display
        if (state.showChartAmount) {
            percentEl.innerText = formatCompact(totalSpent);
            percentEl.style.fontSize = totalSpent > 9999 ? '14px' : '18px'; // Adjust font for long numbers
            percentLabelEl.innerText = 'Total';
        } else {
            percentEl.innerText = `${percentage}%`;
            percentEl.style.fontSize = '18px';
            percentLabelEl.innerText = 'Spent';
        }

        const budgetCard = document.querySelector('.budget-card');
        if (percentage >= 80) budgetCard.classList.add('warning');
        else budgetCard.classList.remove('warning');
    };

    // Chart Click Interaction
    if (budgetChartEl) { // Safer check
        budgetChartEl.addEventListener('click', (e) => {
            // Simple toggle
            state.showChartAmount = !state.showChartAmount;
            // Add haptic
            if (navigator.vibrate) navigator.vibrate(20);
            updateDashboard();
        });
    }

    const renderStats = () => {
        const filteredTx = getFilteredTransactions();

        const totals = {};
        // Init logic: maybe init all categories to 0?
        state.categories.forEach(c => totals[c] = 0);

        let maxTotal = 0;

        filteredTx.forEach(t => {
            const cat = t.category;
            // Handle legacy or deleted categories safely
            if (totals[cat] === undefined) totals[cat] = 0;
            totals[cat] += t.amount;
            if (totals[cat] > maxTotal) maxTotal = totals[cat];
        });

        if (maxTotal === 0) maxTotal = 1;

        barChartEl.innerHTML = '';

        // Filter out zero entries for cleaner look? Or keep them?
        // Let's filter out 0s for custom categories especially
        const activeCategories = Object.keys(totals).filter(k => totals[k] > 0);

        if (activeCategories.length === 0) {
            barChartEl.innerHTML = '<div style="width:100%; text-align:center; color:var(--text-secondary); opacity:0.7; font-size:12px; margin-top:20px;">No expenses for this period</div>';
            return;
        }

        activeCategories.forEach(cat => {
            const amount = totals[cat];
            const heightPercent = Math.round((amount / maxTotal) * 100);
            const visualHeight = amount > 0 ? Math.max(heightPercent, 10) : 0;

            const group = document.createElement('div');
            group.className = 'chart-bar-group';

            // Generate class string based on name
            // We use simple matching or default
            let catClass = `cat-${cat.toLowerCase().split(' ')[0]}`; // simple class generation
            // If it's a known one, it will pick up CSS. If not, we can add inline color (random or fixed)

            // To support custom categories nicely without complex CSS injection, 
            // we can just check if it matches standard ones, else give it a generic color.
            const standard = ['food', 'transport', 'shopping', 'ent'];
            let isStandard = standard.some(s => cat.toLowerCase().includes(s));

            let barStyle = `height: ${visualHeight}%;`;
            if (!isStandard) {
                barStyle += ` background-color: #26A69A; opacity: 0.7;`; // Default Mint
            }

            group.innerHTML = `
                <div class="chart-value">${amount > 0 ? Math.round(amount) : ''}</div>
                <div class="chart-bar ${catClass}" style="${barStyle}"></div>
                <div class="chart-label"><ion-icon name="${getCategoryIcon(cat)}"></ion-icon></div>
            `;
            barChartEl.appendChild(group);
        });

        statsListEl.innerHTML = '<div style="text-align:center; color:var(--text-secondary); margin-top:20px; font-size:14px;">Spending by Category</div>';
    };

    const deleteTransaction = (id) => {
        if (confirm('Delete this transaction?')) {
            state.transactions = state.transactions.filter(t => t.id !== id);
            saveState(); // Persist
            updateDashboard();
            renderTransactions(); // This uses current view filter
            renderStats(); // Update stats

            const currentCatTitle = categoryModalTitle.innerText.replace(' Details', '');
            if (categoryModal.classList.contains('open') && currentCatTitle) {
                openCategoryDetails(currentCatTitle); // Re-open to refresh list
            }
        }
    };

    const startEditTransaction = (id) => {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return;

        state.editingId = id;
        amountInput.value = tx.amount;
        noteInput.value = tx.note || '';

        selectedCategory = tx.category;
        renderCategories(); // Ensure visual selection

        saveExpenseBtn.innerText = 'Update Expense';
        categoryModal.classList.remove('open');
        modal.classList.add('open');
    };

    const openCategoryDetails = (categoryName) => {
        const filteredTx = getFilteredTransactions();
        const categoryTransactions = filteredTx
            .filter(t => t.category === categoryName)
            .sort((a, b) => b.date - a.date);

        if (categoryTransactions.length === 0) {
            categoryModal.classList.remove('open');
            renderTransactions();
            return;
        }

        categoryModalTitle.innerText = `${categoryName} Details`;
        categoryTransactionList.innerHTML = '';

        categoryTransactions.forEach(t => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            const titleText = t.note ? t.note : t.title;

            item.innerHTML = `
                <div class="icon-box category-${t.category.toLowerCase().split(' ')[0]}">
                    <ion-icon name="${t.icon}"></ion-icon>
                </div>
                <div class="details">
                    <span class="title">${titleText}</span>
                    <span class="time">${formatTime(t.date)}</span>
                </div>
                <div class="amount negative">-${formatCurrency(t.amount)}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn"><ion-icon name="create-outline"></ion-icon></button>
                    <button class="action-btn delete-btn"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            `;

            item.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                startEditTransaction(t.id);
            });
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTransaction(t.id);
            });

            categoryTransactionList.appendChild(item);
        });

        categoryModal.classList.add('open');
    };

    const renderTransactions = () => {
        transactionListEl.innerHTML = ''; // Only clears Home View list
        const filteredTx = getFilteredTransactions();

        if (filteredTx.length === 0) {
            transactionListEl.appendChild(emptyStateEl);
            emptyStateEl.style.display = 'block';
        } else {
            emptyStateEl.style.display = 'none';

            const groups = {};
            filteredTx.forEach(t => {
                if (!groups[t.category]) {
                    groups[t.category] = {
                        name: t.category,
                        amount: 0,
                        count: 0,
                        icon: t.icon,
                        latestDate: t.date
                    };
                }
                groups[t.category].amount += t.amount;
                groups[t.category].count += 1;
                if (t.date > groups[t.category].latestDate) {
                    groups[t.category].latestDate = t.date;
                }
            });

            const sortedGroups = Object.values(groups).sort((a, b) => b.latestDate - a.latestDate);

            sortedGroups.forEach(group => {
                const item = document.createElement('div');
                item.className = 'transaction-item';
                item.style.cursor = 'pointer';
                const subtext = `${group.count} transaction${group.count > 1 ? 's' : ''}`;

                // Fallback icon box color
                const catClass = `category-${group.name.toLowerCase().split(' ')[0]}`;

                item.innerHTML = `
                    <div class="icon-box ${catClass}">
                        <ion-icon name="${group.icon}"></ion-icon>
                    </div>
                    <div class="details">
                        <span class="title">${group.name}</span>
                        <span class="time">${subtext} • Tap to view</span>
                    </div>
                    <div class="amount negative">-${formatCurrency(group.amount)}</div>
                `;
                item.addEventListener('click', () => openCategoryDetails(group.name));
                transactionListEl.appendChild(item);
            });
        }
    };

    const saveTransaction = () => {
        const amountStr = amountInput.value;
        const amount = parseFloat(amountStr);
        const note = noteInput.value.trim();

        if (amount <= 0 && state.editingId === null) {
            alert("Please enter a valid amount");
            return;
        }

        let msg = 'Saved!';

        if (state.editingId) {
            const txIndex = state.transactions.findIndex(t => t.id === state.editingId);
            if (txIndex > -1) {
                state.transactions[txIndex] = {
                    ...state.transactions[txIndex],
                    amount: amount,
                    category: selectedCategory,
                    icon: getCategoryIcon(selectedCategory),
                    note: note,
                    title: `${selectedCategory} Expense`
                };
                msg = 'Updated!';
            }
        } else {
            const newTx = {
                id: Date.now(),
                title: `${selectedCategory} Expense`,
                amount: amount,
                category: selectedCategory,
                date: Date.now(),
                icon: getCategoryIcon(selectedCategory),
                note: note
            };
            state.transactions.push(newTx);
        }

        saveState(); // Persist
        updateDashboard();
        renderTransactions();
        renderStats(); // Update stats

        saveExpenseBtn.innerText = msg;
        saveExpenseBtn.style.background = 'var(--primary-mint)';
        if (navigator.vibrate) navigator.vibrate(50);

        setTimeout(() => {
            closeModal();
            setTimeout(() => {
                saveExpenseBtn.innerText = 'Save Expense';
                saveExpenseBtn.style.background = 'linear-gradient(135deg, var(--primary-mint) 0%, #00897B 100%)';
                amountInput.value = '0';
                noteInput.value = '';
                state.editingId = null;
            }, 300);
        }, 400);
    };

    // --- Event Listeners ---
    const openModal = () => {
        state.editingId = null;
        saveExpenseBtn.innerText = 'Save Expense';
        amountInput.value = '0';
        noteInput.value = '';
        renderCategories(); // Ensure fresh list
        modal.classList.add('open');
    };
    const closeModal = () => modal.classList.remove('open');
    const closeCategoryModal = () => categoryModal.classList.remove('open');

    closeCategoryBtn.addEventListener('click', closeCategoryModal);
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) closeCategoryModal();
    });

    addExpenseBtn.addEventListener('click', openModal);
    closeExpenseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    keys.forEach(key => {
        key.addEventListener('click', () => {
            const value = key.innerText;
            const currentAmount = amountInput.value === '0' ? '' : amountInput.value;
            if (key.classList.contains('backspace') || key.innerHTML.includes('backspace')) {
                amountInput.value = currentAmount.slice(0, -1) || '0';
                return;
            }
            if (value === '.') {
                if (!currentAmount.includes('.')) amountInput.value = (currentAmount || '0') + '.';
                return;
            }
            if (currentAmount.replace('.', '').length < 7) amountInput.value = currentAmount + value;
        });
    });

    // Search Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTransactions(); // Only re-render list, keeps charts/totals based on view-only or search?
            // Usually totals reflect what's visible, so let's update dashboard too if we want dynamic totals
            updateDashboard();
            // Note: Stats usually show ALL for the period, but filtering them by search is cool too.
            renderStats();
        });
    }

    saveExpenseBtn.addEventListener('click', saveTransaction);

    // Save Budget Listener
    saveBudgetBtn.addEventListener('click', () => {
        const val = parseFloat(budgetInput.value);
        if (val > 0) {
            state.budget = val;
            saveState();
            updateDashboard();

            saveBudgetBtn.innerText = "Budget Updated!";
            saveBudgetBtn.style.background = 'var(--primary-mint)';
            if (navigator.vibrate) navigator.vibrate(50);

            setTimeout(() => {
                saveBudgetBtn.innerText = "Update Budget";
                saveBudgetBtn.style.background = 'linear-gradient(135deg, var(--primary-mint) 0%, #00897B 100%)';
            }, 1000);
        } else {
            alert('Please enter a valid amount');
        }
    });



    // Settings Listeners
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            window.location.href = 'mailto:subratadas991915@gmail.com?subject=BOYS Expense Tracker Support';
        });
    }

    // Dark Mode Logic
    const darkModeToggle = document.getElementById('darkModeToggle');
    const theme = localStorage.getItem('theme');

    // Init state
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (darkModeToggle) darkModeToggle.checked = true;
    }

    if (darkModeToggle) {
        // Toggle visual style helper
        const updateToggleStyle = () => {
            const slider = darkModeToggle.nextElementSibling;
            const knob = slider.querySelector('.slider-round');
            if (darkModeToggle.checked) {
                slider.style.backgroundColor = 'var(--primary-mint)';
                knob.style.transform = 'translateX(22px)';
            } else {
                slider.style.backgroundColor = '#ccc';
                knob.style.transform = 'translateX(0)';
            }
        };

        // Init style
        updateToggleStyle();

        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
            updateToggleStyle();
        });
    }

    resetDataBtn.addEventListener('click', () => {
        if (confirm("⚠️ Are you sure? This will delete ALL your transactions and budget settings permanently.")) {
            localStorage.clear();
            location.reload();
        }
    });

    // --- PDF Export Logic ---
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // -- Title & Header --
            doc.setFontSize(22);
            doc.setTextColor(38, 166, 154); // Mint Green
            doc.text("BOYS Expense Tracker", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(117, 117, 117); // Grey
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

            // -- Summary Section --
            let totalSpent = state.transactions.reduce((sum, t) => sum + t.amount, 0);
            let budget = state.budget; // Daily View baseline

            doc.setFillColor(240, 244, 248);
            doc.rect(14, 35, 182, 30, 'F'); // Grey box

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("Total Spending", 20, 45);
            doc.text("Daily Budget", 100, 45);

            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(`Rs. ${totalSpent.toFixed(2)}`, 20, 55);
            doc.text(`Rs. ${budget.toFixed(2)}`, 100, 55);

            // -- Transaction Table --
            const tableColumn = ["Date", "Category", "Description", "Amount"];
            const tableRows = [];

            // Sort by date desc
            const sortedTx = [...state.transactions].sort((a, b) => b.date - a.date);

            sortedTx.forEach(tx => {
                const txData = [
                    new Date(tx.date).toLocaleDateString(),
                    tx.category,
                    tx.note || tx.title,
                    `Rs. ${tx.amount.toFixed(2)}`
                ];
                tableRows.push(txData);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 75,
                theme: 'grid',
                headStyles: { fillColor: [38, 166, 154] }, // Mint Green Header
                alternateRowStyles: { fillColor: [248, 250, 252] },
                styles: { fontSize: 10, cellPadding: 3 }
            });

            // Save
            doc.save(`BOYS_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    }

    exportDataBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boys_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // View Toggles
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            state.currentView = btn.dataset.view;
            updateDashboard();
            renderTransactions();
            renderStats();
        });
    });

    // Bottom Nav - Switching Views
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const viewName = item.getAttribute('name');

            // Hide all first
            homeView.style.display = 'none';
            statsView.style.display = 'none';
            budgetView.style.display = 'none';
            settingsView.style.display = 'none';

            if (viewName === 'home') {
                homeView.style.display = 'block';
                renderTransactions();
            } else if (viewName === 'bar-chart') {
                statsView.style.display = 'block';
                renderStats();
            } else if (viewName === 'wallet') {
                budgetView.style.display = 'block';
                budgetInput.value = state.budget;
            } else if (viewName === 'settings') {
                settingsView.style.display = 'block';
            }
        });
    });

    // Initialize
    if (state.transactions.length === 0) {
        renderTransactions();
    } else {
        renderTransactions();
        updateDashboard();
        renderStats();
    }

    // Initial Render of categories
    renderCategories();

});
