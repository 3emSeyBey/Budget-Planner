-- Budget Planner Database Schema for Vercel/Serverless
-- Compatible with PlanetScale, Railway, or other MySQL-compatible services

-- Budget categories table
CREATE TABLE IF NOT EXISTS budget_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    bank VARCHAR(50),
    description TEXT,
    is_essential BOOLEAN DEFAULT FALSE,
    priority_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly budget plans table
CREATE TABLE IF NOT EXISTS weekly_budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_date DATE NOT NULL,
    category_id INT NOT NULL,
    planned_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_amount DECIMAL(10,2) DEFAULT 0,
    status ENUM('planned', 'active', 'completed') DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_week_category (week_date, category_id)
);

-- Expenses tracking table
CREATE TABLE IF NOT EXISTS expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_date DATE NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50),
    location VARCHAR(100),
    receipt_image VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE
);

-- Smart adjustments table
CREATE TABLE IF NOT EXISTS budget_adjustments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_date DATE NOT NULL,
    from_category_id INT,
    to_category_id INT,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    adjustment_type ENUM('manual', 'smart', 'emergency') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (to_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL
);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly summary table for quick access
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_date DATE NOT NULL UNIQUE,
    total_planned DECIMAL(10,2) NOT NULL DEFAULT 12000,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_saved DECIMAL(10,2) DEFAULT 0,
    remaining_budget DECIMAL(10,2) DEFAULT 0,
    budget_utilization DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default budget categories based on the CSV
INSERT IGNORE INTO budget_categories (id, name, bank, description, is_essential, priority_order) VALUES
(1, 'Phone', 'UnoBank', 'Mobile phone bills and data', TRUE, 1),
(2, 'Groceries', 'GoTyme', 'Food and household items', TRUE, 2),
(3, 'Rent', 'GSave', 'Monthly rent payment', TRUE, 3),
(4, 'Electric', 'MayBank', 'Electricity bills', TRUE, 4),
(5, 'Motorbike', 'Maya', 'Transportation and fuel', TRUE, 5),
(6, 'Daily Expense', 'GCash', 'Daily miscellaneous expenses', FALSE, 6),
(7, 'Savings', 'Maya Savings', 'Emergency and future savings', TRUE, 7),
(8, 'GCredit', 'GCash', 'GCash credit payments', FALSE, 8),
(9, 'CIMB Credit', 'CIMB', 'CIMB credit card payments', FALSE, 9),
(10, 'Misc', 'BPI', 'Miscellaneous expenses', FALSE, 10),
(11, 'Extra Debts', 'Cebuana', 'Additional debt payments', FALSE, 11);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_budgets_date ON weekly_budgets(week_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(week_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_date ON budget_adjustments(week_date);
