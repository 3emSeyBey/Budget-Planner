# Smart Budget Planner - Project Structure

This document describes the clean, organized structure of the Smart Budget Planner application optimized for Vercel deployment.

## 📁 Directory Structure

```
budget-planner/
├── 📁 api/                          # Vercel serverless functions
│   ├── 📁 budget/
│   │   ├── current.js               # Get current week's budget
│   │   └── week.js                  # Weekly budget management
│   ├── 📁 expenses/
│   │   ├── add.js                   # Add new expense
│   │   └── current.js               # Get current week's expenses
│   ├── 📁 smart/
│   │   ├── alerts.js                # Smart spending alerts
│   │   └── health.js                # Budget health score
│   ├── categories.js                # Budget categories endpoint
│   └── setup.js                     # Database initialization
├── 📁 lib/                          # Core application logic
│   ├── budget-manager.js            # Budget management logic
│   ├── database.js                  # Database connection utility
│   ├── expense-tracker.js           # Expense tracking logic
│   ├── smart-features.js            # AI and smart features
│   ├── database-schema.sql          # MySQL schema (TiDB/Railway)
│   ├── database-schema-postgresql.sql # PostgreSQL schema (Neon/Supabase)
│   └── database-schema-sqlite.sql   # SQLite schema (Turso)
├── 📁 public/                       # Static files served by Vercel
│   ├── 📁 assets/
│   │   ├── 📁 css/
│   │   │   └── style.css            # Custom styles
│   │   └── 📁 js/
│   │       └── app.js               # Frontend JavaScript
│   ├── index.html                   # Main application interface
│   ├── setup.html                   # Database setup page
│   └── Weekly_Budget_Plan_Sep2025_Mar2026 - Sheet1.csv # Original data
├── package.json                     # Node.js dependencies
├── vercel.json                      # Vercel configuration
├── env.example                      # Environment variables template
├── README.md                        # Main documentation
├── VERCEL_DEPLOYMENT.md             # Deployment guide
└── PROJECT_STRUCTURE.md             # This file
```

## 🗂️ File Descriptions

### API Endpoints (`/api/`)
- **Serverless Functions**: Each file is a Vercel serverless function
- **RESTful Design**: Follows REST API conventions
- **CORS Enabled**: All endpoints include CORS headers
- **Error Handling**: Comprehensive error handling and logging

### Core Logic (`/lib/`)
- **Database Layer**: Handles all database operations
- **Business Logic**: Contains all application logic
- **Schema Files**: Multiple database schemas for different providers
- **Reusable**: Can be imported by any API endpoint

### Static Files (`/public/`)
- **Frontend**: Complete React-like SPA in vanilla JavaScript
- **Assets**: CSS and JavaScript files
- **Setup Page**: User-friendly database initialization
- **Data**: Original CSV file for reference

### Configuration Files
- **package.json**: Node.js dependencies and scripts
- **vercel.json**: Vercel deployment configuration
- **env.example**: Template for environment variables

## 🚀 Deployment Ready

This structure is optimized for:
- ✅ **Vercel Deployment**: All files in correct locations
- ✅ **Serverless Functions**: Each API endpoint is separate
- ✅ **Static Hosting**: Frontend files in `/public/`
- ✅ **Environment Variables**: Secure configuration
- ✅ **Multiple Databases**: Support for various database providers

## 🔧 Development Workflow

1. **Local Development**: Use `vercel dev` for local testing
2. **Database Setup**: Use `/public/setup.html` for initialization
3. **API Testing**: All endpoints available at `/api/*`
4. **Frontend**: Served from `/public/index.html`

## 📊 Database Support

The application supports multiple database providers:
- **MySQL**: TiDB Serverless, Railway
- **PostgreSQL**: Neon, Supabase
- **SQLite**: Turso

Each has its own schema file in `/lib/` for easy setup.

## 🧹 Cleanup Completed

Removed files:
- ❌ Old PHP files (`classes/`, `config/`)
- ❌ PHP setup scripts (`setup.php`, `test.php`)
- ❌ Old database schema (`database.sql`)
- ❌ Unused API file (`api/index.php`)

The codebase is now clean, organized, and ready for production deployment on Vercel!
