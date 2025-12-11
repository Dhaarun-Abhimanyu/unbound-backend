const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    createUser, 
    updateUserCredits,
    getAuditLogs,
    getSystemStats,
    getPendingCommands,
    processPendingCommand
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
router.get('/admin/audit-logs', getAuditLogs);

// System Stats
router.get('/admin/system-stats', getSystemStats);

// Pending Commands
router.get('/admin/pending-commands', getPendingCommands);
router.post('/admin/pending-commands/:id/process', processPendingCommand);

module.exports = router;