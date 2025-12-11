const express = require('express');
const router = express.Router();
const { getRules, createRule, deleteRule } = require('../controllers/ruleController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Protect all routes and require Admin role
router.use(protect);
router.use(admin);

router.get('/', getRules);
router.post('/', createRule);
router.delete('/:id', deleteRule);

module.exports = router;