const Rule = require('../models/Rule');

/**
 * Processes a command and determines the outcome by matching against DB rules.
 *
 * @param {string} commandText - The command to process.
 * @returns {Promise<object>} - Object containing outcome code and matched rule ID.
 * Outcome codes: 1 (ACCEPTED), 2 (REJECTED), 3 (PENDING_APPROVAL)
 */
const processCommand = async (commandText) => {
    try {
        // Fetch all rules, sorted by priority (highest first)
        const rules = await Rule.find({}).sort({ priority: -1 });

        for (const rule of rules) {
            try {
                const regex = new RegExp(rule.pattern);
                if (regex.test(commandText)) {
                    console.log(`Command "${commandText}" matched rule: ${rule.pattern} (${rule.action})`);
                    
                    let outcomeCode;
                    switch (rule.action) {
                        case 'AUTO_ACCEPT':
                            outcomeCode = 1;
                            break;
                        case 'AUTO_REJECT':
                            outcomeCode = 2;
                            break;
                        case 'REQUIRE_APPROVAL':
                            outcomeCode = 3;
                            break;
                        default:
                            outcomeCode = 3; // Default to safe state (pending) if unknown
                    }

                    return { outcome: outcomeCode, matchedRuleId: rule._id };
                }
            } catch (err) {
                console.error(`Invalid regex in rule ${rule._id}: ${rule.pattern}`, err);
                // Continue to next rule if one fails
            }
        }

        // Default behavior if no rules match:
        // You can choose to ACCEPT (1) or REJECT (2) by default.
        // For a secure system, default REJECT or PENDING is safer.
        // Let's assume default ACCEPT for now as per typical "blacklist" approach,
        // or default REJECT for "whitelist" approach.
        // Based on "firewall" description, usually default is allow unless blocked, 
        // OR default block unless allowed. Let's go with Default Pending (3) for safety?
        // Or 1 (Accept) if no rules exist. Let's return 1 for now to keep it simple.
        return { outcome: 1, matchedRuleId: null }; 

    } catch (error) {
        console.error('Error processing command rules:', error);
        return { outcome: 3, matchedRuleId: null }; // Fail safe to pending
    }
};

module.exports = { processCommand };