const mongoose = require('mongoose');

const CommandLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    matched_rule_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rule'
    },
    command_text: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: 'executed_at', updatedAt: false }
});

module.exports = mongoose.model('CommandLog', CommandLogSchema);