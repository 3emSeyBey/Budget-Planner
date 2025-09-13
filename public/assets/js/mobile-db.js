/**
 * Mobile Database Manager for Offline Budget Planner
 * Uses IndexedDB for client-side storage in the browser/Capacitor
 */

class MobileDatabase {
    constructor() {
        this.dbName = 'BudgetPlannerDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createTables(db);
            };
        });
    }

    createTables(db) {
        // Budget Categories Table
        if (!db.objectStoreNames.contains('categories')) {
            const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
            categoryStore.createIndex('name', 'name', { unique: true });
            categoryStore.createIndex('bank', 'bank', { unique: false });
        }

        // Weekly Budgets Table
        if (!db.objectStoreNames.contains('weekly_budgets')) {
            const budgetStore = db.createObjectStore('weekly_budgets', { keyPath: 'id', autoIncrement: true });
            budgetStore.createIndex('week_date', 'week_date', { unique: false });
            budgetStore.createIndex('category_id', 'category_id', { unique: false });
            budgetStore.createIndex('week_category', ['week_date', 'category_id'], { unique: true });
        }

        // Expenses Table
        if (!db.objectStoreNames.contains('expenses')) {
            const expenseStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
            expenseStore.createIndex('week_date', 'week_date', { unique: false });
            expenseStore.createIndex('category_id', 'category_id', { unique: false });
        }

        // Weekly Summaries Table
        if (!db.objectStoreNames.contains('weekly_summaries')) {
            const summaryStore = db.createObjectStore('weekly_summaries', { keyPath: 'id', autoIncrement: true });
            summaryStore.createIndex('week_date', 'week_date', { unique: true });
        }

        // Insert default categories
        this.insertDefaultCategories(db);
    }

    insertDefaultCategories(db) {
        const defaultCategories = [
            { name: 'Phone', bank: 'UnoBank', description: 'Mobile phone bills and data', is_essential: 1, priority_order: 1 },
            { name: 'Groceries', bank: 'GoTyme', description: 'Food and household items', is_essential: 1, priority_order: 2 },
            { name: 'Rent', bank: 'GSave', description: 'Monthly rent payment', is_essential: 1, priority_order: 3 },
            { name: 'Electric', bank: 'MayBank', description: 'Electricity bills', is_essential: 1, priority_order: 4 },
            { name: 'Motorbike', bank: 'Maya', description: 'Transportation and fuel', is_essential: 1, priority_order: 5 },
            { name: 'Daily Expense', bank: 'GCash', description: 'Daily miscellaneous expenses', is_essential: 0, priority_order: 6 },
            { name: 'Savings', bank: 'Maya Savings', description: 'Emergency and future savings', is_essential: 1, priority_order: 7 },
            { name: 'GCredit', bank: 'GCash', description: 'GCash credit payments', is_essential: 0, priority_order: 8 },
            { name: 'CIMB Credit', bank: 'CIMB', description: 'CIMB credit card payments', is_essential: 0, priority_order: 9 },
            { name: 'Misc', bank: 'BPI', description: 'Miscellaneous expenses', is_essential: 0, priority_order: 10 },
            { name: 'Extra Debts', bank: 'Cebuana', description: 'Additional debt payments', is_essential: 0, priority_order: 11 }
        ];

        const transaction = db.transaction(['categories'], 'readwrite');
        const store = transaction.objectStore('categories');

        // Check if categories already exist
        store.count().onsuccess = (event) => {
            if (event.target.result === 0) {
                defaultCategories.forEach(category => {
                    store.add(category);
                });
                console.log('Default categories inserted');
            }
        };
    }

    // Generic query method
    async query(storeName, method, ...args) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store[method](...args);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Categories
    async getCategories() {
        return this.query('categories', 'getAll');
    }

    async addCategory(category) {
        return this.query('categories', 'add', category);
    }

    // Weekly Budgets
    async getWeeklyBudget(weekDate) {
        const transaction = this.db.transaction(['weekly_budgets', 'categories'], 'readonly');
        const budgetStore = transaction.objectStore('weekly_budgets');
        const categoryStore = transaction.objectStore('categories');
        
        return new Promise((resolve, reject) => {
            const request = budgetStore.index('week_date').getAll(weekDate);
            request.onsuccess = async () => {
                const budgets = request.result;
                const result = [];
                
                for (const budget of budgets) {
                    const category = await new Promise((catResolve, catReject) => {
                        const catRequest = categoryStore.get(budget.category_id);
                        catRequest.onsuccess = () => catResolve(catRequest.result);
                        catRequest.onerror = () => catReject(catRequest.error);
                    });
                    
                    result.push({
                        ...budget,
                        category_name: category.name,
                        bank: category.bank
                    });
                }
                resolve(result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async setWeeklyBudget(weekDate, categoryId, amount, actionPlan = 'spend', notes = '') {
        const transaction = this.db.transaction(['weekly_budgets'], 'readwrite');
        const store = transaction.objectStore('weekly_budgets');
        
        // Check if budget already exists for this week and category
        const existingBudget = await this.query('weekly_budgets', 'getAll').then(budgets => 
            budgets.find(b => b.week_date === weekDate && b.category_id === categoryId)
        );
        
        const budgetData = {
            week_date: weekDate,
            category_id: categoryId,
            planned_amount: amount,
            action_plan: actionPlan,
            notes: notes,
            updated_at: new Date().toISOString()
        };
        
        if (existingBudget) {
            budgetData.id = existingBudget.id;
            return this.query('weekly_budgets', 'put', budgetData);
        } else {
            return this.query('weekly_budgets', 'add', budgetData);
        }
    }

    // Expenses
    async getExpenses(weekDate) {
        return this.query('expenses', 'getAll').then(expenses => 
            expenses.filter(expense => expense.week_date === weekDate)
        );
    }

    async addExpense(expense) {
        expense.created_at = new Date().toISOString();
        return this.query('expenses', 'add', expense);
    }

    // Get current week date (Wednesday format)
    getCurrentWeekDate() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
        const wednesday = new Date(today);
        wednesday.setDate(today.getDate() + daysUntilWednesday);
        return wednesday.toISOString().split('T')[0];
    }
}

// Create global instance
window.mobileDB = new MobileDatabase();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileDatabase;
}
