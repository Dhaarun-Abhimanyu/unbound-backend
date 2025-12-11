const express = require('express');
const app = express();
const connectDB = require('./config/db');
const dotenv = require('dotenv');
require('dotenv').config();

// Connect to the database
connectDB();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Mount routers
app.use('/api/commands', require('./routes/commandRoutes'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});