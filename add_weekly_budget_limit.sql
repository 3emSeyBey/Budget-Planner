-- Add weekly_budget_limit column to weekly_summaries table
-- This migration adds the ability to set custom weekly budget limits

ALTER TABLE weekly_summaries 
ADD COLUMN weekly_budget_limit DECIMAL(10,2) DEFAULT 12000 AFTER total_planned;

-- Update existing records to have the default weekly budget limit
UPDATE weekly_summaries 
SET weekly_budget_limit = 12000 
WHERE weekly_budget_limit IS NULL;
