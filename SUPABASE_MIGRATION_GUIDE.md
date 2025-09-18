# Supabase Setup Guide

This guide will help you set up your Budget Planner application with Supabase (PostgreSQL). The application now requires Supabase to run.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Your current Budget Planner application running

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `budget-planner` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (usually takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## Step 3: Set Up Your Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `lib/database-schema-supabase.sql` and paste it into the editor
4. Click "Run" to execute the schema
5. Verify that all tables were created by going to **Table Editor**

## Step 4: Configure Environment Variables

1. Copy your `.env` file to `.env.local` (if you don't have one, copy from `env.example`)
2. Add your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 5: Set Up Initial Data

The database schema includes default budget categories. If you need to add more data, you can:

1. Use the Supabase dashboard to add data directly
2. Use the API endpoints in your application
3. Create custom scripts to populate data

## Step 6: Test Your Application

1. Test the Supabase connection:
```bash
npm run test:supabase
```

2. Start your application:
```bash
npm start
```

3. Test the following features:
   - View budget categories
   - Add/edit weekly budgets
   - Record expenses
   - View analytics
   - All CRUD operations

## Step 7: Deploy to Production

### For Vercel:
1. Add your Supabase environment variables to Vercel:
   - Go to your Vercel project dashboard
   - Go to **Settings** → **Environment Variables**
   - Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`

### For Render:
1. Add your Supabase environment variables to Render:
   - Go to your Render service dashboard
   - Go to **Environment**
   - Add the Supabase variables

### For other platforms:
Add the Supabase environment variables to your deployment platform's environment configuration.

## Step 8: Clean Up (Optional)

Once you've confirmed everything works with Supabase:

1. **Backup your SQLite database** (just in case):
```bash
cp data/budget_planner.db data/budget_planner_backup.db
```

2. **Remove SQLite dependencies** (optional):
```bash
npm uninstall better-sqlite3 sqlite3
```

3. **Remove migration files** (optional):
```bash
rm migrate-to-supabase.js
rm lib/database-sqlite.js
rm lib/database-schema-sqlite.sql
```

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Make sure you've set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your `.env` file

2. **"Failed to connect to Supabase"**
   - Check your Project URL and API keys
   - Ensure your Supabase project is active (not paused)

3. **"Permission denied" errors**
   - Make sure you're using the correct API key (anon vs service_role)
   - Check your Row Level Security (RLS) policies in Supabase

4. **Migration script fails**
   - Check that your SQLite database exists and has data
   - Verify your Supabase schema was created correctly
   - Check the console logs for specific error messages

### Getting Help:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Visit the [Supabase Discord](https://discord.supabase.com)
3. Check the [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

## Benefits of Supabase

- **Scalability**: PostgreSQL can handle much larger datasets
- **Real-time**: Built-in real-time subscriptions
- **Authentication**: Built-in user authentication system
- **Storage**: File storage capabilities
- **Edge Functions**: Serverless functions
- **Dashboard**: Web-based database management
- **Backups**: Automatic backups and point-in-time recovery
- **Security**: Row Level Security (RLS) and built-in security features

## Next Steps

After successful migration, consider:

1. **Enable Authentication**: Use Supabase Auth for user management
2. **Add Real-time Features**: Use Supabase real-time for live updates
3. **File Storage**: Use Supabase Storage for receipt images
4. **Edge Functions**: Move complex logic to Supabase Edge Functions
5. **Analytics**: Use Supabase Analytics for usage insights

## Important Notes

- **Supabase is now required**: The application will not start without proper Supabase configuration
- **No SQLite fallback**: SQLite has been completely removed from the codebase
- **Environment variables are mandatory**: Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY
- **Data persistence**: All data is now stored in your Supabase PostgreSQL database
