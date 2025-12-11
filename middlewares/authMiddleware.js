const User = require('../models/User');
const { hashApiKey } = require('../utils/authUtils');

// Middleware to protect routes
const protect = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ message: 'Unauthorized: API key is missing' });
    }

    try {
        // Hash the provided key to match the stored hash in DB
        const hashedKey = hashApiKey(apiKey);
        
        const user = await User.findOne({ api_key: hashedKey });

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: Invalid API key' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

// Middleware to check for admin role
// Note: This expects 'protect' to be called first to populate req.user
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
};

module.exports = { protect, admin };