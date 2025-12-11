const CommandLog = require('../models/CommandLog');
const { processCommand } = require('../utils/ruleUtils');
const User = require('../models/User');
const { hashApiKey } = require('../utils/authUtils');

// @desc    Submit a command for execution
// @route   POST /api/commands
// @access  Private
const submitCommand = async (req, res) => {
    const { command } = req.body;
    const user = req.user;

    if (!command) {
        return res.status(400).json({ message: 'Command text is required' });
    }

    // 1. Check if user has sufficient credits (assuming 1 credit per command)
    if (user.credits < 1) {
        return res.status(403).json({ 
            message: 'Insufficient credits', 
            credits_remaining: user.credits 
        });
    }

    // Await the async rule processing
    const { outcome, matchedRuleId } = await processCommand(command);
    
    let status;
    let output = '';

    switch (outcome) {
        case 1:
            status = 'EXECUTED';
            output = `Mock execution of: ${command}`;
            
            // 2. Deduct credits only if executed
            user.credits -= 1;
            await user.save();
            break;
        case 2:
            status = 'REJECTED';
            output = 'Command was rejected by a rule.';
            break;
        case 3:
            status = 'PENDING_APPROVAL';
            output = 'Command is awaiting admin approval.';
            break;
        default:
            return res.status(500).json({ message: 'Unknown command processing outcome' });
    }

    try {
        await CommandLog.create({
            user_id: user._id,
            matched_rule_id: matchedRuleId, // Save the rule that triggered this
            command_text: command,
            status: status,
        });

        res.status(200).json({
            status,
            output,
            credits_remaining: user.credits
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to log command', error: error.message });
    }
};

// @desc    Get user's command history
// @route   GET /api/commands/history
// @access  Private
const getCommandHistory = async (req, res) => {
    try {
        const logs = await CommandLog.find({ user_id: req.user._id }).sort({ executed_at: -1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve command history' });
    }
};

// @desc    Get user profile (login by API key)
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
    //console.log('Reached get profile');
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ message: 'Unauthorized: API key is missing' });
    }

    try {
        const hashed = hashApiKey(apiKey);
        const user = await User.findOne({ api_key: hashed });

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized: Invalid API key' });
        }

        const { username, credits, role } = user;
        res.status(200).json({ username, credits, role });
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};


module.exports = {
    submitCommand,
    getCommandHistory,
    getProfile,
};