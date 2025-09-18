-- Budget Planner Database Schema for Supabase (PostgreSQL)
-- Compatible with Supabase PostgreSQL database

-- Enable UUID extension for better primary keys (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Budget categories table
CREATE TABLE IF NOT EXISTS budget_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bank VARCHAR(50),
    description TEXT,
    is_essential BOOLEAN DEFAULT FALSE,
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly budget plans table
CREATE TABLE IF NOT EXISTS weekly_budgets (
    id SERIAL PRIMARY KEY,
    week_date DATE NOT NULL,
    category_id INTEGER NOT NULL,
    planned_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    actual_amount DECIMAL(10,2) DEFAULT 0,
    action_plan VARCHAR(10) DEFAULT 'spend' CHECK (action_plan IN ('spend', 'save')),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE,
    UNIQUE (week_date, category_id)
);

-- Expenses tracking table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    week_date DATE NOT NULL,
    category_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50),
    location VARCHAR(100),
    receipt_image VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE
);

-- Smart adjustments table
CREATE TABLE IF NOT EXISTS budget_adjustments (
    id SERIAL PRIMARY KEY,
    week_date DATE NOT NULL,
    from_category_id INTEGER,
    to_category_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    adjustment_type VARCHAR(20) DEFAULT 'manual' CHECK (adjustment_type IN ('manual', 'smart', 'emergency')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (from_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (to_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL
);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly summary table for quick access
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id SERIAL PRIMARY KEY,
    week_date DATE NOT NULL UNIQUE,
    total_planned DECIMAL(10,2) NOT NULL DEFAULT 12000,
    weekly_budget_limit DECIMAL(10,2) DEFAULT 12000,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_saved DECIMAL(10,2) DEFAULT 0,
    remaining_budget DECIMAL(10,2) DEFAULT 0,
    budget_utilization DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default budget categories based on the CSV
INSERT INTO budget_categories (id, name, bank, description, is_essential, priority_order) VALUES
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
(11, 'Extra Debts', 'Cebuana', 'Additional debt payments', FALSE, 11)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_budgets_date ON weekly_budgets(week_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(week_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_date ON budget_adjustments(week_date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_weekly_budgets_updated_at 
    BEFORE UPDATE ON weekly_budgets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_summaries_updated_at 
    BEFORE UPDATE ON weekly_summaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your authentication needs)
CREATE POLICY "Enable read access for all users" ON budget_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON budget_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON budget_categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON budget_categories FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON weekly_budgets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON weekly_budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON weekly_budgets FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON weekly_budgets FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON expenses FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON budget_adjustments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON budget_adjustments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON budget_adjustments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON budget_adjustments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON savings_goals FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON savings_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON savings_goals FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON savings_goals FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON weekly_summaries FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON weekly_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON weekly_summaries FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON weekly_summaries FOR DELETE USING (true);
