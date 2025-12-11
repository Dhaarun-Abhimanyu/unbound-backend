const Rule = require('../models/Rule');

// @desc    List all active rules
// @route   GET /api/rules
// @access  Admin
const getRules = async (req, res) => {
    try {
        // Sort by priority (descending) so higher priority rules come first
        const rules = await Rule.find({}).sort({ priority: -1 });
        res.status(200).json(rules);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch rules', error: error.message });
    }
};

// @desc    Create a new rule
// @route   POST /api/rules
// @access  Admin
const createRule = async (req, res) => {
    const { pattern, action, description, priority } = req.body;

    if (!pattern || !action) {
        return res.status(400).json({ message: 'Pattern and action are required' });
    }

    const validActions = ['AUTO_ACCEPT', 'AUTO_REJECT', 'REQUIRE_APPROVAL'];
    if (!validActions.includes(action)) {
        return res.status(400).json({ message: `Invalid action. Must be one of: ${validActions.join(', ')}` });
    }

    // Validate Regex
    try {
        new RegExp(pattern);
    } catch (e) {
        return res.status(400).json({ message: 'Invalid Regular Expression pattern' });
    }

    try {
        // Check for exact duplicate pattern
        const existingRule = await Rule.findOne({ pattern });
        if (existingRule) {
            return res.status(409).json({ 
                message: 'Rule conflict: A rule with this exact pattern already exists.',
                existing_rule_id: existingRule._id
            });
        }

        const rule = await Rule.create({
            pattern,
            action,
            description,
            priority: priority || 0
        });

        res.status(201).json({
            id: rule._id,
            message: 'Rule created successfully',
            rule
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create rule', error: error.message });
    }
};

// @desc    Remove a rule by ID
// @route   DELETE /api/rules/:id
// @access  Admin
const deleteRule = async (req, res) => {
    const { id } = req.params;

    try {
        const rule = await Rule.findByIdAndDelete(id);

        if (!rule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        res.status(200).json({ message: 'Rule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete rule', error: error.message });
    }
};

module.exports = {
    getRules,
    createRule,
    deleteRule
};