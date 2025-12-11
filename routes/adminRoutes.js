const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    createUser, 
    updateUserCredits,
    getAuditLogs,
    getSystemStats
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Protect all routes and require Admin role
router.use(protect);
router.use(admin);

// User Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.post('/users/:id/credits', updateUserCredits);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// System Stats
router.get('/system-stats', getSystemStats);

module.exports = router;