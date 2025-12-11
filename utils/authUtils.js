const crypto = require('crypto');

/**
 * Hashes an API key using SHA-256.
 * @param {string} key - The raw API key.
 * @returns {string} - The hashed API key.
 */
const hashApiKey = (key) => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

module.exports = { hashApiKey };