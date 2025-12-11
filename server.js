const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db');
const dotenv = require('dotenv');
require('dotenv').config();

// Connect to the database
// Only connect if not in test mode to avoid connection errors during mocks
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const PORT = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Use env var or allow all
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Mount routers
app.use('/api/commands', require('./routes/userRoutes'));
app.use('/api/rules', require('./routes/ruleRoutes'));
app.use('/api', require('./routes/adminRoutes'));

// Only listen if this file is run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;