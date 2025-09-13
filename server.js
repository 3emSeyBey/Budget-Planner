const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Log environment info
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Platform:', process.env.RENDER ? 'Render' : 'Local');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes - import each API file individually
app.use('/api/categories', require('./api/categories'));
app.use('/api/budget', require('./api/budget'));
app.use('/api/expenses', require('./api/expenses'));
app.use('/api/analytics', require('./api/analytics'));
app.use('/api/smart', require('./api/smart'));
app.use('/api/recommendations', require('./api/recommendations'));
app.use('/api/setup', require('./api/setup'));

app.listen(PORT, () => {
    console.log(`🚀 Budget Planner running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔧 Setup: http://localhost:${PORT}/setup.html`);
});
