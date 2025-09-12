# Troubleshooting Guide

## Common Issues and Solutions

### 1. "The page could not be found" / NOT_FOUND Error

**Error**: `The page could not be found NOT_FOUND hkg1::kfjql-1757689005985-b3bc39b53734`

**Causes**:
- API endpoints not being recognized by Vercel
- Incorrect file structure
- Routing configuration issues
- Missing environment variables

**Solutions**:

#### Step 1: Test API Connection
1. Go to `https://your-app.vercel.app/setup.html`
2. Click **"Test API Connection"** first
3. This will tell you if the API endpoints are working at all

#### Step 2: Check Vercel Deployment
1. Go to your Vercel dashboard
2. Check the deployment logs for any errors
3. Look for function build errors

#### Step 3: Verify File Structure
Make sure your project has this structure:
```
budget-planner/
├── api/
│   ├── setup.js
│   ├── health.js
│   ├── test-db.js
│   └── ...
├── lib/
├── public/
└── vercel.json
```

#### Step 4: Check Environment Variables
1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Make sure `DATABASE_URL` is set
3. Make sure `TIDB_CA_CERT` is set (if using TiDB)

#### Step 5: Redeploy
1. Make a small change to trigger a new deployment
2. Or use `vercel --prod` to force redeploy

### 2. Database Connection Issues

**Error**: "Database connection failed" or SSL errors

**Solutions**:
1. **Test Database Connection**: Use the "Test Database Connection" button
2. **Check Environment Variables**: Verify `DATABASE_URL` and `TIDB_CA_CERT` are set
3. **Verify Certificate Format**: Make sure the CA certificate includes BEGIN/END lines

### 3. Environment Variable Issues

**Error**: "DATABASE_URL environment variable is not set"

**Solutions**:
1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Add `DATABASE_URL` with your database connection string
3. Add `TIDB_CA_CERT` with your TiDB CA certificate (if using TiDB)
4. Make sure to select all environments (Production, Preview, Development)
5. Redeploy after adding environment variables

### 4. Framework Preset Issues

**Error**: Build failures or deployment issues

**Solutions**:
1. In Vercel dashboard, choose **"Other"** as framework preset
2. Don't set a build command
3. Don't set an output directory
4. Let Vercel auto-detect from `package.json`

## Debugging Steps

### 1. Test API Endpoints Manually
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test database endpoint
curl https://your-app.vercel.app/api/test-db

# Test setup endpoint
curl -X POST https://your-app.vercel.app/api/setup
```

### 2. Check Vercel Function Logs
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Functions" tab
4. Click on any function to see logs
5. Look for error messages

### 3. Use the Setup Page
1. Go to `https://your-app.vercel.app/setup.html`
2. Use the test buttons in order:
   - Test API Connection
   - Test Database Connection
   - Initialize Database

## Quick Fixes

### If API endpoints are not working:
1. Check `vercel.json` configuration
2. Verify file structure
3. Redeploy the project

### If database connection fails:
1. Check environment variables
2. Verify database connection string
3. Check CA certificate format (for TiDB)

### If setup fails:
1. Test API connection first
2. Test database connection
3. Check Vercel function logs
4. Verify environment variables

## Getting Help

If you're still having issues:

1. **Check Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
2. **Check Function Logs**: Look at the Vercel dashboard function logs
3. **Test Endpoints**: Use the setup page test buttons
4. **Verify Configuration**: Check all environment variables and file structure

## Common Vercel Issues

### Build Failures
- Make sure `package.json` has correct dependencies
- Check that all required files are in the repository
- Verify Node.js version compatibility

### Function Timeouts
- Database queries might be taking too long
- Check database connection and query performance
- Consider adding connection pooling

### Environment Variable Issues
- Variables are case-sensitive
- Must be set for all environments
- Redeploy after adding new variables
