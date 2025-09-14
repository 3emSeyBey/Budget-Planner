/**
 * Mobile Budget Planner App
 * Offline-capable version using IndexedDB
 */

class MobileBudgetPlanner {
    constructor() {
        this.db = null;
        this.currentWeek = this.getCurrentWeek();
        this.categories = [];
        this.budgetData = [];
        this.expenseData = [];
        
        this.init();
    }

    async init() {
        // Wait for database to initialize
        this.db = await window.mobileDB;
        
        this.setupEventListeners();
        this.setupCurrentWeekTracking();
        this.setupWeekSelector();
        this.loadCategories();
        this.loadDashboard();
        this.setupDateInputs();
        
        // Initialize mobile-specific features
        this.initMobileFeatures();
    }

    initMobileFeatures() {
        // Add mobile-specific UI enhancements
        this.addMobileStyles();
        // Disabled swipe gestures for navigation
        // this.setupTouchGestures();
        this.setupOfflineIndicator();
    }

    addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile-specific styles */
            .mobile-container {
                padding: 10px;
                max-width: 100%;
            }
            
            .mobile-card {
                margin-bottom: 15px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .mobile-table {
                font-size: 14px;
                overflow-x: auto;
            }
            
            .mobile-table th,
            .mobile-table td {
                padding: 8px 4px;
                white-space: nowrap;
            }
            
            .mobile-btn {
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 16px;
                margin: 5px;
            }
            
            .mobile-input {
                padding: 12px;
                border-radius: 8px;
                font-size: 16px;
                margin: 5px 0;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 10px;
                }
                
                .card {
                    margin-bottom: 15px;
                }
                
                .table-responsive {
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupTouchGestures() {
        // Add swipe gestures for navigation
        let startX = 0;
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next section
                    this.navigateNext();
                } else {
                    // Swipe right - previous section
                    this.navigatePrevious();
                }
            }
        });
    }

    setupOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.innerHTML = `
            <div class="alert alert-success position-fixed" style="top: 80px; right: 10px; z-index: 1050; display: none;">
                <i class="fas fa-wifi"></i> Offline Mode Active
            </div>
        `;
        document.body.appendChild(indicator);
        
        // Show offline indicator
        document.querySelector('#offline-indicator .alert').style.display = 'block';
    }

    navigateNext() {
        const sections = ['dashboard', 'budget', 'expenses', 'analytics', 'smart'];
        const currentSection = document.querySelector('.content-section.active')?.id;
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex < sections.length - 1) {
            this.showSection(sections[currentIndex + 1]);
        }
    }

    navigatePrevious() {
        const sections = ['dashboard', 'budget', 'expenses', 'analytics', 'smart'];
        const currentSection = document.querySelector('.content-section.active')?.id;
        const currentIndex = sections.indexOf(currentSection);
        if (currentIndex > 0) {
            this.showSection(sections[currentIndex - 1]);
        }
    }

    async loadCategories() {
        try {
            this.categories = await this.db.getCategories();
            console.log('Categories loaded:', this.categories.length);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadDashboard() {
        try {
            const weekDate = this.getCurrentWeekDate();
            const budget = await this.db.getWeeklyBudget(weekDate);
            
            if (budget.length === 0) {
                await this.initializeNewWeek(weekDate);
                const updatedBudget = await this.db.getWeeklyBudget(weekDate);
                await this.displayBudget(updatedBudget);
            } else {
                await this.displayBudget(budget);
            }
            
            this.updateDashboardStats(budget);
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showAlert('error', 'Failed to load dashboard data');
        }
    }

    async displayBudget(budget) {
        const tbody = document.querySelector('#budget-table tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (budget.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No budget data available for this week
                    </td>
                </tr>
            `;
            return;
        }

        budget.forEach(item => {
            const actionPlan = item.action_plan || 'spend';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.category_name}</td>
                <td>${item.bank}</td>
                <td>₱${parseFloat(item.planned_amount || 0).toLocaleString()}</td>
                <td>
                    <select class="form-select form-select-sm action-plan-select mobile-input" 
                            data-category-id="${item.category_id}" 
                            data-week-date="${item.week_date}"
                            data-selected="${actionPlan}"
                            style="min-width: 100px;">
                        <option value="spend" ${actionPlan === 'spend' ? 'selected' : ''}>Spend</option>
                        <option value="save" ${actionPlan === 'save' ? 'selected' : ''}>Save</option>
                    </select>
                </td>
                <td>₱${parseFloat(item.actual_amount || 0).toLocaleString()}</td>
                <td>₱${parseFloat((item.planned_amount || 0) - (item.actual_amount || 0)).toLocaleString()}</td>
                <td>
                    <span class="badge bg-success">ON TRACK</span>
                </td>
                <td>
                    <span class="badge bg-secondary">Current</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="mobileApp.editBudget(${item.category_id}, '${item.week_date}', '${item.category_name}', ${item.planned_amount || 0}, '${item.notes || ''}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        this.setupActionPlanListeners();
    }

    setupActionPlanListeners() {
        const actionPlanSelects = document.querySelectorAll('.action-plan-select');
        actionPlanSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateActionPlan(e.target);
            });
        });
    }

    async updateActionPlan(select) {
        const categoryId = select.dataset.categoryId;
        const weekDate = select.dataset.weekDate;
        const actionPlan = select.value;

        try {
            // Update the action plan in the database
            const currentBudget = await this.db.query('weekly_budgets', 'getAll').then(budgets => 
                budgets.find(b => b.week_date === weekDate && b.category_id == categoryId)
            );

            if (currentBudget) {
                currentBudget.action_plan = actionPlan;
                await this.db.query('weekly_budgets', 'put', currentBudget);
            }

            // Update visual styling
            select.dataset.selected = actionPlan;
            this.updateActionPlanStyling(select);

            this.showAlert('success', 'Action plan updated successfully!');
        } catch (error) {
            console.error('Failed to update action plan:', error);
            this.showAlert('error', 'Failed to update action plan');
        }
    }

    updateActionPlanStyling(select) {
        const actionPlan = select.value;
        select.className = 'form-select form-select-sm action-plan-select mobile-input';
        
        if (actionPlan === 'spend') {
            select.style.backgroundColor = '#10b981';
            select.style.color = 'white';
        } else {
            select.style.backgroundColor = '#f59e0b';
            select.style.color = 'white';
        }
    }

    async initializeNewWeek(weekDate) {
        const defaultAllocations = [
            { categoryId: 1, amount: 500, actionPlan: 'spend' }, // Phone
            { categoryId: 2, amount: 3000, actionPlan: 'spend' }, // Groceries
            { categoryId: 3, amount: 7000, actionPlan: 'spend' }, // Rent
            { categoryId: 4, amount: 1000, actionPlan: 'spend' }, // Electric
            { categoryId: 5, amount: 800, actionPlan: 'spend' }, // Motorbike
            { categoryId: 6, amount: 500, actionPlan: 'spend' }, // Daily Expense
            { categoryId: 7, amount: 1200, actionPlan: 'save' }, // Savings
        ];

        for (const allocation of defaultAllocations) {
            await this.db.setWeeklyBudget(weekDate, allocation.categoryId, allocation.amount, allocation.actionPlan, 'Default allocation');
        }
    }

    updateDashboardStats(budget) {
        const totalPlanned = budget.reduce((sum, item) => sum + (parseFloat(item.planned_amount) || 0), 0);
        const totalSpent = budget.reduce((sum, item) => sum + (parseFloat(item.actual_amount) || 0), 0);
        const remaining = totalPlanned - totalSpent;

        // Update dashboard cards if they exist
        const weeklyBudgetCard = document.querySelector('.stat-card h4');
        if (weeklyBudgetCard) {
            weeklyBudgetCard.textContent = `₱${totalPlanned.toLocaleString()}`;
        }

        const spentCard = document.querySelector('.stat-card:nth-child(2) h4');
        if (spentCard) {
            spentCard.textContent = `₱${totalSpent.toLocaleString()}`;
        }

        const remainingCard = document.querySelector('.stat-card:nth-child(3) h4');
        if (remainingCard) {
            remainingCard.textContent = `₱${remaining.toLocaleString()}`;
        }
    }

    showAlert(type, message) {
        // Simple alert implementation for mobile
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} position-fixed`;
        alertDiv.style.cssText = 'top: 80px; left: 10px; right: 10px; z-index: 1050;';
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Utility methods
    getCurrentWeek() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
        const wednesday = new Date(today);
        wednesday.setDate(today.getDate() + daysUntilWednesday);
        return wednesday.toISOString().split('T')[0];
    }

    getCurrentWeekDate() {
        return this.getCurrentWeek();
    }

    setupEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
            });
        });

        // Mobile menu toggle
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler) {
            navbarToggler.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'budget':
                await this.loadBudget();
                break;
            case 'expenses':
                await this.loadExpenses();
                break;
        }
    }

    async loadBudget() {
        const weekDate = this.currentWeek;
        const budget = await this.db.getWeeklyBudget(weekDate);
        await this.displayBudget(budget);
    }

    async loadExpenses() {
        const weekDate = this.currentWeek;
        const expenses = await this.db.getExpenses(weekDate);
        console.log('Expenses loaded:', expenses);
    }

    setupWeekSelector() {
        const weekSelector = document.getElementById('budget-week-selector');
        if (!weekSelector) return;

        // Generate Wednesday dates
        this.populateWednesdayDates(weekSelector);
        
        // Set current week as default
        weekSelector.value = this.currentWeek;
        
        // Add event listener
        weekSelector.addEventListener('change', (e) => {
            this.handleWeekSelection(e.target.value);
        });
    }

    populateWednesdayDates(selector) {
        selector.innerHTML = '';
        
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        
        let firstWednesday = new Date(startDate);
        while (firstWednesday.getDay() !== 3) {
            firstWednesday.setDate(firstWednesday.getDate() + 1);
        }
        
        const currentDate = new Date(firstWednesday);
        
        for (let i = 0; i < 104; i++) {
            const dateStr = this.formatDateForAPI(currentDate);
            const displayStr = this.formatDateForDisplay(currentDate);
            
            const option = document.createElement('option');
            option.value = dateStr;
            option.textContent = displayStr;
            selector.appendChild(option);
            
            currentDate.setDate(currentDate.getDate() + 7);
        }
    }

    formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateForDisplay(date) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    handleWeekSelection(dateValue) {
        if (!dateValue) return;
        this.currentWeek = dateValue;
        this.loadBudget();
    }

    setupCurrentWeekTracking() {
        this.updateCurrentWeekUI();
    }

    updateCurrentWeekUI() {
        const weekSelector = document.getElementById('budget-week-selector');
        if (weekSelector) {
            weekSelector.value = this.currentWeek;
        }
    }

    setupDateInputs() {
        const today = new Date();
        const currentWeek = this.getCurrentWeek();
        
        const budgetWeekSelector = document.getElementById('budget-week-selector');
        if (budgetWeekSelector) {
            budgetWeekSelector.value = currentWeek;
        }
        
        const quickDateInput = document.getElementById('quick-date');
        if (quickDateInput) {
            quickDateInput.value = today.toISOString().split('T')[0];
        }
    }

    closeMobileMenu() {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        if (navbarCollapse) {
            navbarCollapse.classList.remove('show');
        }
    }

    editBudget(categoryId, weekDate, categoryName, amount, notes) {
        // Simple edit implementation
        const newAmount = prompt(`Edit budget for ${categoryName}:`, amount);
        if (newAmount !== null && !isNaN(newAmount)) {
            this.db.setWeeklyBudget(weekDate, categoryId, parseFloat(newAmount), 'spend', notes);
            this.loadBudget();
            this.showAlert('success', 'Budget updated successfully!');
        }
    }
}

// Initialize the mobile app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileApp = new MobileBudgetPlanner();
});
