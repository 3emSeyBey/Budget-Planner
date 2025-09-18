/**
 * Supabase Database connection utility
 * Uses Supabase client for PostgreSQL database
 */

const { createClient } = require('@supabase/supabase-js');

// Global singleton Supabase client instance
let supabase = null;
let isInitialized = false;

function getSupabaseClient() {
  if (!supabase) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
      }

      supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false // Disable session persistence for server-side usage
        }
      });

      // Only log initialization once
      if (!global.__supabaseInitialized) {
        console.log('Supabase client initialized');
        global.__supabaseInitialized = true;
      }
    } catch (error) {
      console.error('Supabase client initialization failed:', error);
      throw error;
    }
  }
  
  return supabase;
}

async function query(sql, params = []) {
  try {
    const client = getSupabaseClient();
    
    // For Supabase, we need to use the REST API with raw SQL
    // Note: This requires enabling the 'sql' feature in Supabase
    const { data, error } = await client.rpc('exec_sql', { 
      sql_query: sql
    });
    
    if (error) {
      // If exec_sql doesn't exist, try a different approach
      // For now, we'll throw a more helpful error
      if (error.code === 'PGRST202') {
        throw new Error(`Raw SQL execution not available. Please use the queryBuilder methods instead of raw SQL. Original query: ${sql.substring(0, 100)}...`);
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Supabase query error:', error);
    throw error;
  }
}

// Alternative approach using Supabase's query builder
class SupabaseQueryBuilder {
  constructor() {
    this.client = getSupabaseClient();
  }

  // Budget Categories
  async getBudgetCategories() {
    const { data, error } = await this.client
      .from('budget_categories')
      .select('*')
      .order('priority_order');
    
    if (error) throw error;
    return data;
  }

  async insertBudgetCategory(category) {
    const { data, error } = await this.client
      .from('budget_categories')
      .insert(category)
      .select();
    
    if (error) throw error;
    return { insertId: data[0]?.id, affectedRows: 1 };
  }

  async updateBudgetCategory(id, updates) {
    const { data, error } = await this.client
      .from('budget_categories')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { affectedRows: data.length };
  }

  async deleteBudgetCategory(id) {
    const { error } = await this.client
      .from('budget_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { affectedRows: 1 };
  }

  // Weekly Budgets
  async getWeeklyBudgets(weekDate = null) {
    let query = this.client
      .from('weekly_budgets')
      .select(`
        *,
        budget_categories (
          id,
          name,
          bank,
          description,
          is_essential,
          priority_order
        )
      `);
    
    if (weekDate) {
      query = query.eq('week_date', weekDate);
    }
    
    const { data, error } = await query.order('week_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async insertWeeklyBudget(budget) {
    const { data, error } = await this.client
      .from('weekly_budgets')
      .insert(budget)
      .select();
    
    if (error) throw error;
    return { insertId: data[0]?.id, affectedRows: 1 };
  }

  async updateWeeklyBudget(id, updates) {
    const { data, error } = await this.client
      .from('weekly_budgets')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { affectedRows: data.length };
  }

  // Expenses
  async getExpenses(weekDate = null, categoryId = null) {
    let query = this.client
      .from('expenses')
      .select(`
        *,
        budget_categories (
          id,
          name,
          bank
        )
      `);
    
    if (weekDate) {
      query = query.eq('week_date', weekDate);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async insertExpense(expense) {
    const { data, error } = await this.client
      .from('expenses')
      .insert(expense)
      .select();
    
    if (error) throw error;
    return { insertId: data[0]?.id, affectedRows: 1 };
  }

  async updateExpense(id, updates) {
    const { data, error } = await this.client
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { affectedRows: data.length };
  }

  async deleteExpense(id) {
    const { error } = await this.client
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { affectedRows: 1 };
  }

  // Budget Adjustments
  async getBudgetAdjustments(weekDate = null) {
    let query = this.client
      .from('budget_adjustments')
      .select(`
        *,
        from_category:budget_categories!budget_adjustments_from_category_id_fkey (
          id,
          name,
          bank
        ),
        to_category:budget_categories!budget_adjustments_to_category_id_fkey (
          id,
          name,
          bank
        )
      `);
    
    if (weekDate) {
      query = query.eq('week_date', weekDate);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async insertBudgetAdjustment(adjustment) {
    const { data, error } = await this.client
      .from('budget_adjustments')
      .insert(adjustment)
      .select();
    
    if (error) throw error;
    return { insertId: data[0]?.id, affectedRows: 1 };
  }

  // Savings Goals
  async getSavingsGoals() {
    const { data, error } = await this.client
      .from('savings_goals')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async insertSavingsGoal(goal) {
    const { data, error } = await this.client
      .from('savings_goals')
      .insert(goal)
      .select();
    
    if (error) throw error;
    return { insertId: data[0]?.id, affectedRows: 1 };
  }

  async updateSavingsGoal(id, updates) {
    const { data, error } = await this.client
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return { affectedRows: data.length };
  }

  // Weekly Summaries
  async getWeeklySummary(weekDate) {
    const { data, error } = await this.client
      .from('weekly_summaries')
      .select('*')
      .eq('week_date', weekDate)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  async insertWeeklySummary(summary) {
    const { data, error } = await this.client
      .from('weekly_summaries')
      .insert(summary)
      .select();
    
    if (error) throw error;
    return { insertId: data[0]?.id, affectedRows: 1 };
  }

  async updateWeeklySummary(weekDate, updates) {
    const { data, error } = await this.client
      .from('weekly_summaries')
      .update(updates)
      .eq('week_date', weekDate)
      .select();
    
    if (error) throw error;
    return { affectedRows: data.length };
  }
}

// Create a singleton instance
const queryBuilder = new SupabaseQueryBuilder();

async function getConnection() {
  // For compatibility with existing code that expects a connection object
  return {
    execute: async (sql, params = []) => {
      const result = await query(sql, params);
      return [result, { affectedRows: result.affectedRows || 0, insertId: result.insertId }];
    },
    end: () => {
      // Supabase client doesn't need explicit connection closing
      return Promise.resolve();
    }
  };
}

function closeConnection() {
  // Supabase client doesn't need explicit connection closing
  return Promise.resolve();
}

module.exports = {
  getConnection,
  query,
  closeConnection,
  getSupabaseClient,
  queryBuilder
};
