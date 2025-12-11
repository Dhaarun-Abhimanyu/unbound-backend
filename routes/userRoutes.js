const express = require('express');
const router = express.Router();
const {
    submitCommand,
    getCommandHistory,
    getProfile
} = require('../controllers/userController'); // Fixed: changed commandController to userController
const { protect } = require('../middlewares/authMiddleware'); // Fixed: changed auth to

// All routes in this file are protected
//router.use(protect);

router.post('/', protect, submitCommand);
router.get('/history', protect, getCommandHistory);
router.get('/profile', getProfile);

module.exports = router;