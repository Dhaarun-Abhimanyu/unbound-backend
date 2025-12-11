const express = require('express');
const router = express.Router();
const {
    submitCommand,
    getCommandHistory,
    getProfile,
    getNotifications,
    deleteNotification
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// All routes in this file are protected
//router.use(protect);

router.post('/', protect, submitCommand);
router.get('/history', protect, getCommandHistory);
router.get('/profile', getProfile);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.delete('/notifications/:id', protect, deleteNotification);

module.exports = router;