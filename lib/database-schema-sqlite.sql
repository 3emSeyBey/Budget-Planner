-- Budget Planner Database Schema for SQLite (Turso)
-- Compatible with Turso and other SQLite-based services

-- Budget categories table
CREATE TABLE IF NOT EXISTS budget_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bank TEXT,
    description TEXT,
    is_essential INTEGER DEFAULT 0,
    priority_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weekly budget plans table
CREATE TABLE IF NOT EXISTS weekly_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_date TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    planned_amount REAL NOT NULL DEFAULT 0,
    actual_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE,
    UNIQUE (week_date, category_id)
);

-- Expenses tracking table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_date TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    payment_method TEXT,
    location TEXT,
    receipt_image TEXT,
    is_recurring INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE
);

-- Smart adjustments table
CREATE TABLE IF NOT EXISTS budget_adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_date TEXT NOT NULL,
    from_category_id INTEGER,
    to_category_id INTEGER,
    amount REAL NOT NULL,
    reason TEXT,
    adjustment_type TEXT DEFAULT 'manual' CHECK (adjustment_type IN ('manual', 'smart', 'emergency')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (to_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL
);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weekly summary table for quick access
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_date TEXT NOT NULL UNIQUE,
    total_planned REAL NOT NULL DEFAULT 12000,
    total_spent REAL DEFAULT 0,
    total_saved REAL DEFAULT 0,
    remaining_budget REAL DEFAULT 0,
    budget_utilization REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default budget categories based on the CSV
INSERT OR IGNORE INTO budget_categories (id, name, bank, description, is_essential, priority_order) VALUES
(1, 'Phone', 'UnoBank', 'Mobile phone bills and data', 1, 1),
(2, 'Groceries', 'GoTyme', 'Food and household items', 1, 2),
(3, 'Rent', 'GSave', 'Monthly rent payment', 1, 3),
(4, 'Electric', 'MayBank', 'Electricity bills', 1, 4),
(5, 'Motorbike', 'Maya', 'Transportation and fuel', 1, 5),
(6, 'Daily Expense', 'GCash', 'Daily miscellaneous expenses', 0, 6),
(7, 'Savings', 'Maya Savings', 'Emergency and future savings', 1, 7),
(8, 'GCredit', 'GCash', 'GCash credit payments', 0, 8),
(9, 'CIMB Credit', 'CIMB', 'CIMB credit card payments', 0, 9),
(10, 'Misc', 'BPI', 'Miscellaneous expenses', 0, 10),
(11, 'Extra Debts', 'Cebuana', 'Additional debt payments', 0, 11);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_budgets_date ON weekly_budgets(week_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(week_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_date ON budget_adjustments(week_date);
