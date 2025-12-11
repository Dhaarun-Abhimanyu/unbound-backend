const mongoose = require('mongoose');

const RuleSchema = new mongoose.Schema({
    pattern: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    priority: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Rule', RuleSchema);