# Smart Budget Planner

A comprehensive, mobile-friendly budget planning and expense tracking web application built with PHP, designed specifically for managing a ₱12,000 weekly salary allocation across 11 budget categories.

## Features

### 🎯 Core Budget Management
- **Weekly Budget Planning**: Plan and allocate your ₱12,000 weekly salary across 11 categories
- **Real-time Tracking**: Track actual expenses against planned budgets
- **Smart Alerts**: Get notified when approaching budget limits or overspending
- **Budget Health Score**: Monitor your financial health with AI-powered scoring

### 📱 Mobile-First Design
- **Responsive Interface**: Optimized for mobile devices with touch-friendly controls
- **Progressive Web App**: Works offline and can be installed on mobile devices
- **Fast Loading**: Optimized for quick access on mobile networks

### 🧠 Smart Features
- **AI-Powered Reallocation**: Get suggestions for optimizing budget allocation
- **Spending Predictions**: Predict next week's optimal budget based on patterns
- **Auto-Adjustments**: Automatically adjust budgets based on spending behavior
- **Smart Insights**: Personalized recommendations for better money management

### 📊 Analytics & Reporting
- **Spending Trends**: Visualize spending patterns over time
- **Category Analysis**: See which categories consume most of your budget
- **Monthly Forecasts**: Project monthly spending based on weekly patterns
- **Savings Recommendations**: Get tips for reducing expenses

### 💰 Expense Tracking
- **Quick Add**: Fast expense entry with category selection
- **Detailed Tracking**: Record payment methods, locations, and descriptions
- **Receipt Management**: Upload and store receipt images
- **Expense History**: View and edit past expenses

## Budget Categories

Based on your spreadsheet, the app manages these 11 categories:

1. **Phone (UnoBank)** - Mobile bills and data
2. **Groceries (GoTyme)** - Food and household items
3. **Rent (GSave)** - Monthly rent payments
4. **Electric (MayBank)** - Electricity bills
5. **Motorbike (Maya)** - Transportation and fuel
6. **Daily Expense (GCash)** - Daily miscellaneous expenses
7. **Savings (Maya Savings)** - Emergency and future savings
8. **GCredit** - GCash credit payments
9. **CIMB Credit** - CIMB credit card payments
10. **Misc (BPI)** - Miscellaneous expenses
11. **Extra Debts (Cebuana)** - Additional debt payments

## Installation

### Prerequisites
- Node.js 18+ (for Vercel deployment)
- Free database account (choose one):
  - **TiDB Serverless** (recommended - MySQL compatible, free tier)
  - **Neon PostgreSQL** (free tier, requires schema changes)
  - **Supabase** (free tier, requires schema changes)
  - **Turso** (SQLite-based, free tier)
  - **Railway** (free tier available)

### Setup Steps

1. **Clone/Download the project**
   ```bash
   git clone <repository-url>
   cd budget-planner
   ```

2. **Choose and Setup Database**
   
   **Option A: TiDB Serverless (Recommended - Free)**
   - Sign up at [tidbcloud.com](https://tidbcloud.com)
   - Create a new TiDB Serverless cluster
   - Copy the connection string
   - No code changes needed (MySQL compatible)

   **Option B: Neon PostgreSQL (Free)**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new database
   - Copy the connection string
   - Use `lib/database-schema-postgresql.sql` for schema

   **Option C: Supabase (Free)**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Get connection string from Settings > Database
   - Use `lib/database-schema-postgresql.sql` for schema

   **Option D: Turso (Free)**
   - Sign up at [turso.tech](https://turso.tech)
   - Create a new database
   - Copy the connection string
   - Use `lib/database-schema-sqlite.sql` for schema

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login and deploy
   vercel login
   vercel
   
   # Set database environment variable
   vercel env add DATABASE_URL
   # Paste your database connection string
   
   # Deploy to production
   vercel --prod
   ```

4. **Initialize Database**
   - Visit: `https://your-app.vercel.app/api/setup`
   - Send POST request to initialize database schema
   - Or use the setup page in your deployed app

5. **Access the Application**
   - Open `https://your-app.vercel.app` in your browser
   - The app is now ready to use!

## Usage

### Getting Started
1. **Dashboard**: View your current week's budget status and quick stats
2. **Add Expenses**: Use the quick add form or detailed expense form
3. **Manage Budget**: Adjust weekly budget allocations as needed
4. **View Analytics**: Check spending trends and get insights

### Smart Features
- **Smart Reallocation**: Click "Smart Adjust" to get AI suggestions
- **Predictions**: Use "Predict Next Week" for optimal budget planning
- **Auto-Adjust**: Let the system automatically adjust next week's budget

### Mobile Usage
- The app is fully responsive and works great on mobile devices
- Use the hamburger menu to navigate between sections
- Touch-friendly buttons and forms for easy mobile interaction

## API Endpoints

The application includes a RESTful API for all operations:

### Budget Management
- `GET /api/budget/current` - Get current week's budget
- `GET /api/budget/next` - Get next week's budget
- `GET /api/budget/week?date=YYYY-MM-DD` - Get specific week's budget
- `POST /api/budget/week` - Update budget allocation

### Expense Tracking
- `GET /api/expenses/current` - Get current week's expenses
- `GET /api/expenses/week?date=YYYY-MM-DD` - Get specific week's expenses
- `POST /api/expenses/add` - Add new expense
- `PUT /api/expenses/update` - Update expense
- `DELETE /api/expenses/delete?id=123` - Delete expense

### Smart Features
- `GET /api/smart/reallocate` - Get smart reallocation suggestions
- `GET /api/smart/predict` - Get next week predictions
- `GET /api/smart/health` - Get budget health score
- `GET /api/smart/alerts` - Get spending alerts

### Analytics
- `GET /api/analytics/trends` - Get spending trends
- `GET /api/analytics/top-categories` - Get top spending categories
- `GET /api/analytics/forecast` - Get monthly forecast

## File Structure

```
budget-planner/
├── index.html              # Main application interface
├── setup.php               # Database setup script
├── database.sql            # Database schema
├── config/
│   └── database.php        # Database configuration
├── classes/
│   ├── BudgetManager.php   # Budget management logic
│   ├── ExpenseTracker.php  # Expense tracking logic
│   └── SmartFeatures.php   # AI and smart features
├── api/
│   └── index.php           # API endpoints
├── assets/
│   ├── css/
│   │   └── style.css       # Custom styles
│   └── js/
│       └── app.js          # Frontend JavaScript
└── README.md               # This file
```

## Technology Stack

- **Backend**: PHP 7.4+ with PDO for database operations
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: MySQL 5.7+
- **UI Framework**: Bootstrap 5.3
- **Charts**: Chart.js 4.4
- **Icons**: Font Awesome 6.4

## Security Features

- **SQL Injection Protection**: All queries use prepared statements
- **XSS Prevention**: Input sanitization and output escaping
- **CSRF Protection**: Token-based form protection
- **Input Validation**: Server-side validation for all inputs

## Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Smart caching for frequently accessed data
- **Mobile Optimization**: Compressed assets and lazy loading
- **Progressive Enhancement**: Works without JavaScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For support or questions, please create an issue in the repository or contact the development team.

---

**Note**: This application is specifically designed for managing a ₱12,000 weekly salary with the 11 budget categories from your spreadsheet. The smart features are tailored to help optimize your specific financial situation and spending patterns.
