# Vercel Deployment Guide for Smart Budget Planner

This guide will help you deploy the Smart Budget Planner as a serverless application on Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: You'll need a MySQL-compatible database. Free options:
   - **TiDB Serverless** (recommended - MySQL compatible, free tier)
   - **Neon PostgreSQL** (free tier, requires schema changes)
   - **Supabase** (free tier, requires schema changes)
   - **Turso** (SQLite-based, free tier)
   - **Railway** (free tier available)
   - **PlanetScale** (paid only, no free tier)

## Step 1: Database Setup

### Option A: TiDB Serverless (Recommended - Free)

1. Go to [tidbcloud.com](https://tidbcloud.com) and create an account
2. Create a new TiDB Serverless cluster (free tier available)
3. Copy the connection string from the "Connect" tab
4. The connection string will look like:
   ```
   mysql://username:password@host:port/database_name?ssl={"rejectUnauthorized":true}
   ```
5. **Free Tier**: 1GB storage, 1 million read/write requests per month

### Option B: Neon PostgreSQL (Free Alternative)

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new PostgreSQL database
3. Copy the connection string from the database settings
4. **Free Tier**: 3GB storage, 10GB transfer per month
5. **Note**: You'll need to update the database schema for PostgreSQL compatibility

### Option C: Supabase (Free PostgreSQL)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Settings > Database to get the connection string
4. **Free Tier**: 500MB database, 2GB bandwidth per month
5. **Note**: You'll need to update the database schema for PostgreSQL compatibility

### Option D: Turso (SQLite-based, Free)

1. Go to [turso.tech](https://turso.tech) and create an account
2. Create a new database
3. Copy the connection string
4. **Free Tier**: 9GB storage, unlimited reads, 1M writes per month
5. **Note**: Uses SQLite, so some MySQL-specific features may need adjustment

### Option E: Railway (Free Tier Available)

1. Go to [railway.app](https://railway.app) and create an account
2. Create a new MySQL database
3. Copy the connection string from the database settings
4. **Free Tier**: $5 credit per month (usually enough for small projects)

### Option F: PlanetScale (Paid Only)

1. Go to [planetscale.com](https://planetscale.com) and create an account
2. Create a new database called `budget_planner`
3. Copy the connection string from the "Connect" tab
4. **Note**: PlanetScale no longer offers a free tier

## Database Compatibility Notes

### MySQL-Compatible (No Code Changes Needed)
- **TiDB Serverless** ✅ - Drop-in replacement for MySQL
- **Railway MySQL** ✅ - Standard MySQL

### PostgreSQL-Compatible (Requires Schema Changes)
- **Neon** - Requires converting MySQL schema to PostgreSQL
- **Supabase** - Requires converting MySQL schema to PostgreSQL

### SQLite-Compatible (Minor Adjustments)
- **Turso** - Uses SQLite, some MySQL features may need adjustment

## Quick Setup for Each Database

### TiDB Serverless (Recommended)
1. Sign up at [tidbcloud.com](https://tidbcloud.com)
2. Create a new TiDB Serverless cluster
3. Get connection string from "Connect" tab
4. Use the default MySQL schema (no changes needed)

### Neon PostgreSQL
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new database
3. Get connection string from dashboard
4. Use `lib/database-schema-postgresql.sql` for schema

### Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database for connection string
4. Use `lib/database-schema-postgresql.sql` for schema

### Turso
1. Sign up at [turso.tech](https://turso.tech)
2. Create a new database
3. Get connection string from dashboard
4. Use `lib/database-schema-sqlite.sql` for schema

## Step 2: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the project**:
   ```bash
   vercel
   ```

4. **Set environment variables**:
   ```bash
   vercel env add DATABASE_URL
   # Paste your database connection string when prompted
   ```

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

### Method 2: GitHub Integration

1. **Push your code to GitHub**
2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Node.js project

3. **Set environment variables**:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `DATABASE_URL` with your database connection string

4. **Deploy**: Vercel will automatically deploy on every push to main branch

## Step 3: Initialize Database

After deployment, you need to initialize your database:

1. **Visit the setup endpoint**:
   ```
   https://your-app.vercel.app/api/setup
   ```

2. **Send a POST request** (you can use curl, Postman, or any API client):
   ```bash
   curl -X POST https://your-app.vercel.app/api/setup
   ```

3. **Or create a simple setup page** by adding this to your project:
   ```html
   <!DOCTYPE html>
   <html>
   <head><title>Setup Database</title></head>
   <body>
     <h1>Database Setup</h1>
     <button onclick="setupDatabase()">Initialize Database</button>
     <div id="result"></div>
     
     <script>
       async function setupDatabase() {
         try {
           const response = await fetch('/api/setup', { method: 'POST' });
           const result = await response.json();
           document.getElementById('result').innerHTML = 
             `<p>${result.success ? 'Success!' : 'Error'}: ${result.message}</p>`;
         } catch (error) {
           document.getElementById('result').innerHTML = `<p>Error: ${error.message}</p>`;
         }
       }
     </script>
   </body>
   </html>
   ```

## Step 4: Access Your Application

1. **Main Application**: `https://your-app.vercel.app`
2. **API Endpoints**: `https://your-app.vercel.app/api/`

## Environment Variables

Set these in your Vercel project settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `mysql://user:pass@host:port/db?ssl={"rejectUnauthorized":true}` |
| `JWT_SECRET` | Secret for JWT tokens (optional) | `your-secret-key` |

## API Endpoints

Your deployed application will have these endpoints:

- `GET /api/categories` - Get budget categories
- `GET /api/budget/current` - Get current week's budget
- `GET /api/budget/week?date=YYYY-MM-DD` - Get specific week's budget
- `POST /api/budget/week` - Update budget allocation
- `GET /api/expenses/current` - Get current week's expenses
- `POST /api/expenses/add` - Add new expense
- `GET /api/smart/alerts` - Get spending alerts
- `GET /api/smart/health` - Get budget health score
- `POST /api/setup` - Initialize database

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify your `DATABASE_URL` is correct
   - Ensure your database allows connections from Vercel's IP ranges
   - Check if SSL is required (most cloud databases require it)

2. **CORS Errors**:
   - The API endpoints include CORS headers
   - If you're still getting CORS errors, check your browser's developer console

3. **Environment Variables Not Working**:
   - Make sure you've set the environment variables in Vercel dashboard
   - Redeploy after setting environment variables
   - Check the variable names match exactly (case-sensitive)

4. **Database Schema Issues**:
   - Run the setup endpoint to initialize the database
   - Check your database logs for any SQL errors

### Debugging

1. **Check Vercel Function Logs**:
   - Go to your Vercel dashboard
   - Click on your project
   - Go to "Functions" tab
   - Click on any function to see logs

2. **Test API Endpoints**:
   ```bash
   # Test categories endpoint
   curl https://your-app.vercel.app/api/categories
   
   # Test current budget
   curl https://your-app.vercel.app/api/budget/current
   ```

## Performance Optimization

1. **Database Connection Pooling**: The app uses connection pooling for better performance
2. **Caching**: Consider adding Redis for caching frequently accessed data
3. **CDN**: Vercel automatically provides CDN for static assets

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **Database Security**: Use strong passwords and enable SSL
3. **API Rate Limiting**: Consider adding rate limiting for production use
4. **Input Validation**: All inputs are validated on the server side

## Monitoring

1. **Vercel Analytics**: Enable Vercel Analytics to monitor performance
2. **Database Monitoring**: Monitor your database performance and usage
3. **Error Tracking**: Consider adding error tracking services like Sentry

## Scaling

- **Vercel**: Automatically scales based on demand
- **Database**: Choose a database plan that can handle your expected load
- **Caching**: Add caching layers as your app grows

## Support

If you encounter issues:

1. Check the Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Check your database provider's documentation
3. Review the function logs in Vercel dashboard
4. Test API endpoints individually to isolate issues

---

**Note**: This application is optimized for Vercel's serverless environment and will automatically scale based on usage. The database connection is handled efficiently with connection pooling, and all API endpoints are designed to work within Vercel's function execution limits.
