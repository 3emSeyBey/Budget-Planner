/**
 * Smart Budget Planner - Main Application JavaScript
 */

class BudgetPlanner {
    constructor() {
        this.apiBase = 'api/';
        this.currentWeek = this.getCurrentWeek();
        this.categories = [];
        this.budgetData = [];
        this.expenseData = [];
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCurrentWeekTracking();
        this.loadCategories();
        this.loadDashboard();
        this.setupDateInputs();
    }

    setupEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('[data-section]');
        console.log('Found navigation links:', navLinks.length);
        
        navLinks.forEach(link => {
            console.log('Setting up listener for:', link.dataset.section);
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Navigation clicked:', link.dataset.section);
                this.showSection(link.dataset.section);
            });
        });

        // Quick expense form
        document.getElementById('quick-expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuickExpense();
        });

        // Expense form
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Budget management
        document.getElementById('load-budget-btn').addEventListener('click', () => {
            this.loadBudget();
        });

        document.getElementById('save-budget-btn').addEventListener('click', () => {
            this.saveBudget();
        });

        document.getElementById('smart-adjust-btn').addEventListener('click', () => {
            this.getSmartReallocations();
        });

        document.getElementById('predict-next-btn').addEventListener('click', () => {
            this.getPredictions();
        });

        // Smart features
        document.getElementById('get-reallocations-btn').addEventListener('click', () => {
            this.getSmartReallocations();
        });

        document.getElementById('get-predictions-btn').addEventListener('click', () => {
            this.getPredictions();
        });

        document.getElementById('auto-adjust-btn').addEventListener('click', () => {
            this.autoAdjustNextWeek();
        });

        document.getElementById('balance-budget-btn').addEventListener('click', () => {
            this.balanceBudget();
        });

        document.getElementById('get-insights-btn').addEventListener('click', () => {
            this.getInsights();
        });

        // Filter expenses
        document.getElementById('filter-expenses-btn').addEventListener('click', () => {
            this.filterExpenses();
        });

        // Modal events
        document.getElementById('save-edit-budget').addEventListener('click', () => {
            this.saveEditBudget();
        });

        document.getElementById('save-edit-expense').addEventListener('click', () => {
            this.saveEditExpense();
        });
    }

    setupDateInputs() {
        const today = new Date();
        const currentWeek = this.getCurrentWeek();
        
        // Set default dates
        document.getElementById('budget-week-selector').value = currentWeek;
        document.getElementById('expense-date').value = today.toISOString().split('T')[0];
        document.getElementById('expense-date-filter').value = currentWeek;
        
        // Setup week selector with week numbers
        this.setupWeekSelector();
    }

    getCurrentWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        
        // Calculate the Wednesday of current week
        if (dayOfWeek === 3) { // Wednesday
            return this.formatDateForAPI(today);
        } else {
            // Calculate days to Wednesday (Wednesday is day 3)
            let daysToWednesday;
            if (dayOfWeek < 3) {
                // If it's before Wednesday (Sun=0, Mon=1, Tue=2), go forward
                daysToWednesday = 3 - dayOfWeek;
            } else {
                // If it's after Wednesday (Thu=4, Fri=5, Sat=6), go back to this week's Wednesday
                daysToWednesday = dayOfWeek - 3;
            }
            
            const wednesday = new Date(today);
            if (dayOfWeek < 3) {
                wednesday.setDate(today.getDate() + daysToWednesday);
            } else {
                wednesday.setDate(today.getDate() - daysToWednesday);
            }
            return this.formatDateForAPI(wednesday);
        }
    }

    setupWeekSelector() {
        const weekSelector = document.getElementById('budget-week-selector');
        if (!weekSelector) return;

        // Generate Wednesday dates from September 2025 onwards
        this.populateWednesdayDates(weekSelector);
        
        // Set current week as default
        const currentWeek = this.getCurrentWeek();
        weekSelector.value = currentWeek;
        
        // Add event listener for week changes
        weekSelector.addEventListener('change', (e) => {
            this.handleWeekSelection(e.target.value);
        });
    }

    populateWednesdayDates(selector) {
        // Clear existing options
        selector.innerHTML = '';
        
        // Start from September 1, 2025
        const startDate = new Date(2025, 8, 1); // September 1, 2025 (month is 0-indexed)
        
        // Find the first Wednesday of September 2025
        let firstWednesday = new Date(startDate);
        while (firstWednesday.getDay() !== 3) { // 3 = Wednesday
            firstWednesday.setDate(firstWednesday.getDate() + 1);
        }
        
        // Generate Wednesday dates for 2 years (104 weeks)
        const wednesdayDates = [];
        const currentDate = new Date(firstWednesday);
        
        for (let i = 0; i < 104; i++) { // 2 years of Wednesdays
            const dateStr = this.formatDateForAPI(currentDate);
            const displayStr = this.formatDateForDisplay(currentDate);
            
            wednesdayDates.push({
                value: dateStr,
                text: displayStr
            });
            
            // Move to next Wednesday
            currentDate.setDate(currentDate.getDate() + 7);
        }
        
        // Add options to selector
        wednesdayDates.forEach(date => {
            const option = document.createElement('option');
            option.value = date.value;
            option.textContent = date.text;
            selector.appendChild(option);
        });
    }

    formatDateForAPI(date) {
        // Format date as YYYY-MM-DD without timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateForDisplay(date) {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        return `${month} ${day}, ${year} (Wed)`;
    }

    handleWeekSelection(dateValue) {
        if (!dateValue) return;
        
        // Update the current week and load budget
        this.currentWeek = dateValue;
        this.loadBudget();
    }

    setupCurrentWeekTracking() {
        // Initialize current week display immediately
        this.updateCurrentWeekUI();
        
        // Check for current week every minute
        setInterval(() => {
            this.checkCurrentWeek();
        }, 60000); // Check every minute
        
        // Also check on page focus
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkCurrentWeek();
            }
        });
    }

    checkCurrentWeek() {
        const newCurrentWeek = this.getCurrentWeek();
        
        // If the week has changed, update the app
        if (newCurrentWeek !== this.currentWeek) {
            console.log('Week changed from', this.currentWeek, 'to', newCurrentWeek);
            this.currentWeek = newCurrentWeek;
            this.updateCurrentWeekUI();
            this.refreshCurrentData();
        }
    }

    updateCurrentWeekUI() {
        // Update the week selector to show current week
        const weekSelector = document.getElementById('budget-week-selector');
        if (weekSelector) {
            weekSelector.value = this.currentWeek;
        }
        
        // Update any current week indicators in the UI
        this.updateCurrentWeekIndicators();
    }

    updateCurrentWeekIndicators() {
        // Add visual indicators for current week
        const currentWeekElements = document.querySelectorAll('[data-current-week]');
        currentWeekElements.forEach(element => {
            element.textContent = this.formatDateForDisplay(new Date(this.currentWeek));
        });
        
        // Update dashboard with current week info
        this.updateDashboardCurrentWeek();
    }

    updateDashboardCurrentWeek() {
        // Update dashboard to show current week information
        const currentWeekElement = document.getElementById('current-week-display');
        if (currentWeekElement) {
            currentWeekElement.textContent = `Current Week: ${this.formatDateForDisplay(new Date(this.currentWeek))}`;
        }
    }

    refreshCurrentData() {
        // Refresh data for the current week
        console.log('Refreshing data for current week:', this.currentWeek);
        
        // Reload dashboard if it's currently active
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && activeSection.id === 'dashboard') {
            this.loadDashboard();
        }
        
        // Reload budget if it's currently active
        if (activeSection && activeSection.id === 'budget') {
            this.loadBudget();
        }
    }

    isCurrentWeek(dateString) {
        return dateString === this.currentWeek;
    }

    getWeekStatus(dateString) {
        if (this.isCurrentWeek(dateString)) {
            return 'current';
        }
        
        const date = new Date(dateString);
        const currentDate = new Date(this.currentWeek);
        
        if (date < currentDate) {
            return 'past';
        } else {
            return 'future';
        }
    }

    getWeekStatusClass(status) {
        switch (status) {
            case 'current':
                return 'bg-success';
            case 'past':
                return 'bg-secondary';
            case 'future':
                return 'bg-primary';
            default:
                return 'bg-light text-dark';
        }
    }

    getWeekStatusText(status) {
        switch (status) {
            case 'current':
                return 'Current';
            case 'past':
                return 'Past';
            case 'future':
                return 'Future';
            default:
                return 'Unknown';
        }
    }

    showSection(sectionName) {
        console.log('Switching to section:', sectionName);
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            console.error('Navigation link not found for section:', sectionName);
        }

        // Show section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            console.error('Section not found:', sectionName);
        }

        // Load section-specific data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'budget':
                this.loadBudget();
                break;
            case 'expenses':
                this.loadExpenses();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'smart':
                this.loadSmartFeatures();
                break;
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(this.apiBase + endpoint, options);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'API call failed');
            }

            return result.data;
        } catch (error) {
            console.error('API Error:', error);
            this.showAlert('error', 'Error: ' + error.message);
            throw error;
        }
    }

    async loadCategories() {
        try {
            this.categories = await this.apiCall('categories');
            this.populateCategorySelects();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    populateCategorySelects() {
        const selects = [
            'quick-category',
            'expense-category',
            'edit-expense-category'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Select Category</option>';
                this.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = `${category.name} (${category.bank})`;
                    select.appendChild(option);
                });
            }
        });
    }

    async loadDashboard() {
        try {
            // Load current week budget
            const budget = await this.apiCall('budget?type=current');
            this.budgetData = budget;

            // Load current week expenses
            const expenses = await this.apiCall('expenses?type=current');
            this.expenseData = expenses;

            // Update dashboard stats
            this.updateDashboardStats(budget, expenses);

            // Load alerts
            await this.loadAlerts();

            // Create budget chart
            this.createBudgetChart(budget);
            this.createSpendingProgressChart(budget);

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            // Show error message to user
            this.showAlert('error', 'Failed to load dashboard data. Please check your connection.');
        }
    }

    updateDashboardStats(budget, expenses) {
        const totalPlanned = budget.reduce((sum, item) => sum + parseFloat(item.planned_amount), 0);
        const totalSpent = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const remaining = 12000 - totalSpent;

        document.getElementById('weekly-spent').textContent = `₱${totalSpent.toLocaleString()}`;
        document.getElementById('remaining-budget').textContent = `₱${remaining.toLocaleString()}`;

        // Calculate budget health
        this.calculateBudgetHealth(totalSpent, totalPlanned);
    }

    async calculateBudgetHealth(totalSpent, totalPlanned) {
        try {
            const healthData = await this.apiCall('smart?type=health');
            const healthScore = healthData.health_score || 100;
            
            document.getElementById('health-score').textContent = `${healthScore}%`;
            
            // Update health indicator color
            const healthElement = document.getElementById('health-score');
            healthElement.className = 'mb-0';
            if (healthScore >= 80) {
                healthElement.classList.add('text-success');
            } else if (healthScore >= 60) {
                healthElement.classList.add('text-warning');
            } else {
                healthElement.classList.add('text-danger');
            }
        } catch (error) {
            console.error('Failed to calculate budget health:', error);
            // Set default health score if API fails
            document.getElementById('health-score').textContent = '100%';
            const healthElement = document.getElementById('health-score');
            healthElement.className = 'mb-0 text-success';
        }
    }

    async loadAlerts() {
        try {
            const alerts = await this.apiCall('smart?type=alerts');
            this.displayAlerts(alerts);
        } catch (error) {
            console.error('Failed to load alerts:', error);
        }
    }

    displayAlerts(alerts) {
        const container = document.getElementById('alerts-container');
        
        if (alerts.length === 0) {
            container.innerHTML = '<div class="text-center text-muted"><i class="fas fa-check-circle me-2"></i>No alerts at this time</div>';
            return;
        }

        container.innerHTML = '';
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${alert.type === 'danger' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'} alert-dismissible fade show`;
            alertDiv.innerHTML = `
                <i class="fas fa-${alert.type === 'danger' ? 'exclamation-triangle' : alert.type === 'warning' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                ${alert.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            container.appendChild(alertDiv);
        });
    }

    createBudgetChart(budget) {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Skipping chart creation.');
            return;
        }

        const ctx = document.getElementById('budget-chart').getContext('2d');
        
        if (this.charts.budget) {
            this.charts.budget.destroy();
        }

        if (!budget || budget.length === 0) {
            // Show empty state
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No budget data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const labels = budget.map(item => item.category_name);
        const plannedData = budget.map(item => parseFloat(item.planned_amount || 0));

        this.charts.budget = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Planned Amount',
                    data: plannedData,
                    backgroundColor: [
                        '#6366f1', '#10b981', '#ef4444', '#f59e0b', '#06b6d4',
                        '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#64748b', '#1e293b'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ₱${value.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    createSpendingProgressChart(budget) {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Skipping spending progress chart creation.');
            return;
        }

        const ctx = document.getElementById('spending-progress-chart').getContext('2d');
        
        if (this.charts.spendingProgress) {
            this.charts.spendingProgress.destroy();
        }

        if (!budget || budget.length === 0) {
            // Show empty state
            ctx.fillStyle = '#6c757d';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No budget data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const categories = budget.map(item => item.category_name);
        const plannedAmounts = budget.map(item => parseFloat(item.planned_amount || 0));
        const actualAmounts = budget.map(item => parseFloat(item.actual_amount || 0));
        
        // Calculate spending percentages
        const spendingPercentages = plannedAmounts.map((planned, index) => {
            if (planned === 0) return 0;
            return Math.min((actualAmounts[index] / planned) * 100, 100);
        });

        // Color coding based on spending percentage
        const backgroundColors = spendingPercentages.map(percentage => {
            if (percentage >= 90) return '#ef4444'; // Red - Over budget
            if (percentage >= 75) return '#f59e0b'; // Yellow - Warning
            return '#10b981'; // Green - Good
        });

        this.charts.spendingProgress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Spending %',
                    data: spendingPercentages,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 3,
                layout: {
                    padding: { top: 10, bottom: 10, left: 10, right: 10 }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const category = context.label;
                                const percentage = context.parsed.y.toFixed(1);
                                const planned = plannedAmounts[context.dataIndex];
                                const actual = actualAmounts[context.dataIndex];
                                return `${category}: ${percentage}% (₱${actual.toLocaleString()} / ₱${planned.toLocaleString()})`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    async addQuickExpense() {
        const categoryId = document.getElementById('quick-category').value;
        const amount = document.getElementById('quick-amount').value;
        const description = document.getElementById('quick-description').value;

        if (!categoryId || !amount) {
            this.showAlert('warning', 'Please fill in all required fields');
            return;
        }

        try {
            await this.apiCall('expenses?type=add', 'POST', {
                week_date: this.currentWeek,
                category_id: categoryId,
                amount: amount,
                description: description,
                payment_method: 'Cash'
            });

            this.showAlert('success', 'Expense added successfully!');
            document.getElementById('quick-expense-form').reset();
            this.loadDashboard();
        } catch (error) {
            console.error('Failed to add expense:', error);
        }
    }

    async addExpense() {
        const formData = {
            week_date: document.getElementById('expense-date').value,
            category_id: document.getElementById('expense-category').value,
            amount: document.getElementById('expense-amount').value,
            description: document.getElementById('expense-description').value,
            payment_method: document.getElementById('expense-payment').value,
            location: document.getElementById('expense-location').value
        };

        if (!formData.category_id || !formData.amount) {
            this.showAlert('warning', 'Please fill in all required fields');
            return;
        }

        try {
            await this.apiCall('expenses?type=add', 'POST', formData);
            this.showAlert('success', 'Expense added successfully!');
            document.getElementById('expense-form').reset();
            this.loadExpenses();
        } catch (error) {
            console.error('Failed to add expense:', error);
        }
    }

    async loadBudget() {
        let weekDate = this.currentWeek;
        
        // Check if we have a week selector value
        const weekSelector = document.getElementById('budget-week-selector');
        if (weekSelector && weekSelector.value) {
            weekDate = weekSelector.value;
        }
        
        try {
            const budget = await this.apiCall(`budget?type=week&date=${weekDate}`);
            await this.displayBudget(budget);
        } catch (error) {
            console.error('Failed to load budget:', error);
        }
    }

    async displayBudget(budget) {
        const tbody = document.getElementById('budget-table-body');
        tbody.innerHTML = '';

        if (budget.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No budget data found for this week</td></tr>';
            return;
        }

        // Get the week date from the first item
        const weekDate = budget[0]?.week_date;
        const weekStatus = this.getWeekStatus(weekDate);

        budget.forEach(item => {
            const remaining = parseFloat(item.planned_amount) - parseFloat(item.actual_amount || 0);
            const variance = parseFloat(item.actual_amount || 0) - parseFloat(item.planned_amount);
            
            let statusClass = 'status-good';
            let statusText = 'On Track';
            
            if (variance > 200) {
                statusClass = 'status-danger';
                statusText = 'Over Budget';
            } else if (variance > 0) {
                statusClass = 'status-warning';
                statusText = 'Close to Limit';
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.category_name}</td>
                <td>${item.bank}</td>
                <td>₱${parseFloat(item.planned_amount).toLocaleString()}</td>
                <td>₱${parseFloat(item.actual_amount || 0).toLocaleString()}</td>
                <td class="${remaining < 0 ? 'text-danger' : 'text-success'}">₱${remaining.toLocaleString()}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><span class="badge ${this.getWeekStatusClass(weekStatus)}">${this.getWeekStatusText(weekStatus)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="budgetPlanner.editBudget(${item.category_id}, '${item.week_date}', '${item.category_name}', ${item.planned_amount}, '${item.notes || ''}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add totals row
        await this.addBudgetTotalsRow(budget, tbody);
    }

    async addBudgetTotalsRow(budget, tbody) {
        // Calculate totals
        const totalPlanned = budget.reduce((sum, item) => sum + parseFloat(item.planned_amount || 0), 0);
        const totalActual = budget.reduce((sum, item) => sum + parseFloat(item.actual_amount || 0), 0);
        const totalRemaining = totalPlanned - totalActual;
        
        // Get weekly budget limit (default 12000, but should be editable)
        const weeklyBudget = await this.getWeeklyBudgetLimit();
        const budgetUtilization = (totalPlanned / weeklyBudget) * 100;
        
        // Create totals row
        const totalsRow = document.createElement('tr');
        totalsRow.className = 'table-info fw-bold';
        totalsRow.innerHTML = `
            <td><strong>TOTAL</strong></td>
            <td><strong>All Banks</strong></td>
            <td><strong>₱${totalPlanned.toLocaleString()}</strong></td>
            <td><strong>₱${totalActual.toLocaleString()}</strong></td>
            <td class="${totalRemaining < 0 ? 'text-danger' : 'text-success'}"><strong>₱${totalRemaining.toLocaleString()}</strong></td>
            <td>
                <span class="badge ${this.getBudgetUtilizationClass(budgetUtilization)}">
                    ${budgetUtilization.toFixed(1)}% of Weekly Budget
                </span>
            </td>
            <td><span class="badge bg-info">Summary</span></td>
            <td>
                <button class="btn btn-sm btn-outline-secondary" onclick="budgetPlanner.editWeeklyBudget()">
                    <i class="fas fa-cog"></i>
                </button>
            </td>
        `;
        tbody.appendChild(totalsRow);
    }

    async getWeeklyBudgetLimit() {
        try {
            const response = await this.apiCall('budget?type=weekly-limit');
            return response.weekly_budget_limit || 12000;
        } catch (error) {
            console.error('Failed to get weekly budget limit:', error);
            return 12000; // Default fallback
        }
    }

    setWeeklyBudgetLimit(amount) {
        // This is now handled by the database, but keep for compatibility
        localStorage.setItem('weeklyBudgetLimit', amount.toString());
    }

    getBudgetUtilizationClass(percentage) {
        if (percentage > 100) return 'bg-danger';
        if (percentage > 90) return 'bg-warning';
        return 'bg-success';
    }

    editWeeklyBudget() {
        const currentLimit = this.getWeeklyBudgetLimit();
        document.getElementById('weekly-budget-limit').value = currentLimit;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('weeklyBudgetModal'));
        modal.show();
    }

    async saveWeeklyBudget() {
        const newLimit = parseFloat(document.getElementById('weekly-budget-limit').value);
        
        if (isNaN(newLimit) || newLimit <= 0) {
            this.showAlert('error', 'Please enter a valid weekly budget amount.');
            return;
        }

        try {
            // Save to localStorage
            this.setWeeklyBudgetLimit(newLimit);
            
            // Save to database
            await this.apiCall('budget?type=update-weekly-limit', 'POST', {
                weekly_budget_limit: newLimit
            });

            this.showAlert('success', 'Weekly budget limit updated successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('weeklyBudgetModal'));
            modal.hide();
            
            // Refresh budget display
            this.loadBudget();
            
        } catch (error) {
            console.error('Failed to save weekly budget:', error);
            this.showAlert('error', 'Failed to save weekly budget. Please try again.');
        }
    }

    editBudget(categoryId, weekDate, categoryName, amount, notes) {
        document.getElementById('edit-category-id').value = categoryId;
        document.getElementById('edit-week-date').value = weekDate;
        document.getElementById('edit-category-name').value = categoryName;
        document.getElementById('edit-amount').value = amount;
        document.getElementById('edit-notes').value = notes;

        const modal = new bootstrap.Modal(document.getElementById('editBudgetModal'));
        modal.show();
    }

    async saveEditBudget() {
        const categoryId = document.getElementById('edit-category-id').value;
        const weekDate = document.getElementById('edit-week-date').value;
        const amount = document.getElementById('edit-amount').value;
        const notes = document.getElementById('edit-notes').value;

        try {
            await this.apiCall('budget?type=week', 'POST', {
                week_date: weekDate,
                category_id: categoryId,
                amount: amount,
                notes: notes
            });

            this.showAlert('success', 'Budget updated successfully!');
            bootstrap.Modal.getInstance(document.getElementById('editBudgetModal')).hide();
            this.loadBudget();
        } catch (error) {
            console.error('Failed to update budget:', error);
        }
    }

    async loadExpenses() {
        const weekDate = document.getElementById('expense-date-filter').value || this.currentWeek;
        
        try {
            const expenses = await this.apiCall(`expenses?type=week&date=${weekDate}`);
            this.displayExpenses(expenses);
        } catch (error) {
            console.error('Failed to load expenses:', error);
            this.showAlert('error', 'Failed to load expenses. Please try again.');
        }
    }

    displayExpenses(expenses) {
        const tbody = document.getElementById('expenses-table-body');
        tbody.innerHTML = '';

        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No expenses found for this week</td></tr>';
            return;
        }

        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(expense.week_date).toLocaleDateString()}</td>
                <td>${expense.category_name}</td>
                <td>${expense.description || '-'}</td>
                <td>₱${parseFloat(expense.amount).toLocaleString()}</td>
                <td>${expense.payment_method}</td>
                <td>${expense.location || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="budgetPlanner.editExpense(${expense.id}, '${expense.week_date}', ${expense.category_id}, ${expense.amount}, '${expense.description || ''}', '${expense.payment_method}', '${expense.location || ''}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="budgetPlanner.deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    editExpense(expenseId, date, categoryId, amount, description, paymentMethod, location) {
        document.getElementById('edit-expense-id').value = expenseId;
        document.getElementById('edit-expense-date').value = date;
        document.getElementById('edit-expense-category').value = categoryId;
        document.getElementById('edit-expense-amount').value = amount;
        document.getElementById('edit-expense-description').value = description;
        document.getElementById('edit-expense-payment').value = paymentMethod;
        document.getElementById('edit-expense-location').value = location;

        const modal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
        modal.show();
    }

    async saveEditExpense() {
        const expenseId = document.getElementById('edit-expense-id').value;
        const amount = document.getElementById('edit-expense-amount').value;
        const description = document.getElementById('edit-expense-description').value;
        const paymentMethod = document.getElementById('edit-expense-payment').value;
        const location = document.getElementById('edit-expense-location').value;

        try {
            await this.apiCall('expenses?type=update', 'PUT', {
                expense_id: expenseId,
                amount: amount,
                description: description,
                payment_method: paymentMethod,
                location: location
            });

            this.showAlert('success', 'Expense updated successfully!');
            bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
            this.loadExpenses();
        } catch (error) {
            console.error('Failed to update expense:', error);
        }
    }

    async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            await this.apiCall(`expenses?type=delete&id=${expenseId}`, 'DELETE');
            this.showAlert('success', 'Expense deleted successfully!');
            this.loadExpenses();
        } catch (error) {
            console.error('Failed to delete expense:', error);
        }
    }

    async loadAnalytics() {
        try {
            // Load spending trends
            const trends = await this.apiCall('analytics?type=trends');
            this.createTrendsChart(trends);

            // Load top categories
            const topCategories = await this.apiCall('analytics?type=top-categories');
            this.createCategoriesChart(topCategories);

            // Load monthly forecast
            const forecast = await this.apiCall('analytics?type=forecast');
            this.createForecastChart(forecast);

            // Load category breakdown
            this.displayCategoryBreakdown(topCategories);

            // Load savings recommendations
            const recommendations = await this.apiCall('recommendations?type=savings');
            this.displaySavingsRecommendations(recommendations);

        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showAlert('error', 'Failed to load analytics data. Please try again.');
        }
    }

    createTrendsChart(trends) {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Skipping trends chart creation.');
            return;
        }

        const ctx = document.getElementById('trends-chart').getContext('2d');
        
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        const labels = trends.map(trend => new Date(trend.week_date).toLocaleDateString());
        const data = trends.map(trend => parseFloat(trend.total_spent));

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weekly Spending',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        display: true,
                        grid: {
                            display: true
                        },
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }

    createCategoriesChart(categories) {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Skipping categories chart creation.');
            return;
        }

        const ctx = document.getElementById('categories-chart').getContext('2d');
        
        if (this.charts.categories) {
            this.charts.categories.destroy();
        }

        const labels = categories.slice(0, 5).map(cat => cat.category_name);
        const data = categories.slice(0, 5).map(cat => parseFloat(cat.total_spent));

        this.charts.categories = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Spent',
                    data: data,
                    backgroundColor: [
                        '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        display: true,
                        grid: {
                            display: true
                        },
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }

    createForecastChart(forecast) {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Skipping forecast chart creation.');
            return;
        }

        const ctx = document.getElementById('forecast-chart').getContext('2d');
        
        if (this.charts.forecast) {
            this.charts.forecast.destroy();
        }

        const labels = forecast.categories.slice(0, 5).map(cat => cat.category_name);
        const data = forecast.categories.slice(0, 5).map(cat => parseFloat(cat.total_spent));

        this.charts.forecast = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                }
            }
        });
    }

    displayCategoryBreakdown(categories) {
        const container = document.getElementById('category-breakdown');
        container.innerHTML = '';

        categories.forEach(category => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-2';
            div.innerHTML = `
                <span>${category.category_name}</span>
                <span class="fw-bold">₱${parseFloat(category.total_spent).toLocaleString()}</span>
            `;
            container.appendChild(div);
        });
    }

    displaySavingsRecommendations(recommendations) {
        const container = document.getElementById('savings-recommendations');
        container.innerHTML = '';

        if (recommendations.length === 0) {
            container.innerHTML = '<div class="text-muted">No specific recommendations at this time.</div>';
            return;
        }

        recommendations.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'alert alert-info';
            div.innerHTML = `
                <h6>${rec.category}</h6>
                <p class="mb-0">${rec.suggestion}</p>
                <small class="text-muted">Potential savings: ₱${parseFloat(rec.potential_savings).toLocaleString()}/week</small>
            `;
            container.appendChild(div);
        });
    }

    async loadSmartFeatures() {
        // Smart features are loaded on demand when buttons are clicked
    }

    async getSmartReallocations() {
        try {
            const reallocations = await this.apiCall('smart?type=reallocate');
            this.displayReallocations(reallocations);
        } catch (error) {
            console.error('Failed to get reallocations:', error);
            this.showAlert('error', 'Failed to get smart reallocations. Please try again.');
        }
    }

    displayReallocations(reallocations) {
        const container = document.getElementById('reallocations-container');
        container.innerHTML = '';

        if (reallocations.length === 0) {
            container.innerHTML = '<div class="text-muted">No reallocation suggestions at this time.</div>';
            return;
        }

        reallocations.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'alert alert-info';
            div.innerHTML = `
                <h6>${rec.category}</h6>
                <p class="mb-0">${rec.reason}</p>
                ${rec.suggested_reduction ? `<small>Suggested reduction: ₱${parseFloat(rec.suggested_reduction).toLocaleString()}</small>` : ''}
                ${rec.suggested_increase ? `<small>Suggested increase: ₱${parseFloat(rec.suggested_increase).toLocaleString()}</small>` : ''}
            `;
            container.appendChild(div);
        });
    }

    async getPredictions() {
        try {
            const predictions = await this.apiCall('smart?type=predict');
            this.displayPredictions(predictions);
        } catch (error) {
            console.error('Failed to get predictions:', error);
            this.showAlert('error', 'Failed to get predictions. Please try again.');
        }
    }

    displayPredictions(predictions) {
        const container = document.getElementById('predictions-container');
        container.innerHTML = '';

        predictions.forEach(pred => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-2 p-2 border rounded';
            div.innerHTML = `
                <span>${pred.category_name}</span>
                <span class="fw-bold">₱${parseFloat(pred.suggested_amount).toLocaleString()}</span>
            `;
            container.appendChild(div);
        });
    }

    async autoAdjustNextWeek() {
        try {
            const result = await this.apiCall('smart?type=adjust', 'POST', {
                week_date: this.currentWeek
            });
            
            this.showAlert('success', `Auto-adjusted ${result.adjustments_made} categories for next week!`);
        } catch (error) {
            console.error('Failed to auto-adjust:', error);
            this.showAlert('error', 'Failed to auto-adjust budget. Please try again.');
        }
    }

    async balanceBudget() {
        // This would implement budget balancing logic
        this.showAlert('info', 'Budget balancing feature coming soon!');
    }

    async getInsights() {
        // This would implement insights generation
        this.showAlert('info', 'Smart insights feature coming soon!');
    }

    filterExpenses() {
        this.loadExpenses();
    }

    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// BudgetPlanner class is defined above
