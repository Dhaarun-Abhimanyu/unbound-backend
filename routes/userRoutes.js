const express = require('express');
const router = express.Router();
const {
    submitCommand,
    getCommandHistory,
    getProfile
} = require('../controllers/commandController');
const { protect } = require('../middlewares/auth');

// All routes in this file are protected
router.use(protect);

router.post('/', submitCommand);
router.get('/history', getCommandHistory);
router.get('/profile', getProfile);

module.exports = router;