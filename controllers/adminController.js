const User = require('../models/User');
const CommandLog = require('../models/CommandLog');
const { generateApiKey, hashApiKey } = require('../utils/authUtils');

// @desc    List all users
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res) => {
    try {
        // Return users but exclude the sensitive api_key field
        const users = await User.find({}, '-api_key').sort({ created_at: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res) => {
    const { username, role } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        // Check if username already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let apiKey;
        let hashedKey;
        let isUnique = false;

        // Loop to ensure the generated API key is unique (collision is extremely rare but possible)
        while (!isUnique) {
            apiKey = generateApiKey();
            hashedKey = hashApiKey(apiKey);
            
            const existingKey = await User.findOne({ api_key: hashedKey });
            if (!existingKey) {
                isUnique = true;
            }
        }

        const user = await User.create({
            username,
            api_key: hashedKey, // Store the hash
            role: role || 'MEMBER',
            credits: 0
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            api_key: apiKey, // Return the raw key ONLY once
            message: "Save this API key now. It will not be shown again."
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
};

// @desc    Add/Reset credits for a user
// @route   POST /api/users/:id/credits
// @access  Admin
const updateUserCredits = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (amount === undefined || typeof amount !== 'number') {
        return res.status(400).json({ message: 'Amount is required and must be a number' });
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add the amount to existing credits (can be negative to deduct)
        // If you want to RESET credits instead of ADD, change this logic.
        // For now, based on "Add/Reset", I'll assume addition.
        user.credits += amount;
        
        // Prevent negative balance if desired, though not strictly required
        if (user.credits < 0) user.credits = 0;

        await user.save();

        res.status(200).json({
            message: 'Credits updated successfully',
            username: user.username,
            new_balance: user.credits
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to update credits', error: error.message });
    }
};

// @desc    View global execution logs
// @route   GET /api/admin/audit-logs
// @access  Admin
const getAuditLogs = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        
        // Optional filtering by status (e.g., ?status=REJECTED)
        if (status) {
            query.status = status;
        }

        const logs = await CommandLog.find(query)
            .populate('user_id', 'username role') // Show who ran the command
            .populate('matched_rule_id', 'pattern') // Show which rule triggered (if any)
            .sort({ executed_at: -1 });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
    }
};

// @desc    System overview stats
// @route   GET /api/admin/stats
// @access  Admin
const getSystemStats = async (req, res) => {
    try {
        // We can derive stats directly from the logs collection
        const totalCommands = await CommandLog.countDocuments();
        const executed = await CommandLog.countDocuments({ status: 'EXECUTED' });
        const rejected = await CommandLog.countDocuments({ status: 'REJECTED' });
        const pending = await CommandLog.countDocuments({ status: 'PENDING_APPROVAL' });

        res.status(200).json({
            total_commands: totalCommands,
            executed,
            rejected,
            pending
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch system stats', error: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUserCredits,
    getAuditLogs,
    getSystemStats
};