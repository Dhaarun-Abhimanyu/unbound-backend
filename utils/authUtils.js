const crypto = require('crypto');

/**
 * Hashes an API key using SHA-256.
 * @param {string} key - The raw API key.
 * @returns {string} - The hashed API key.
 */
const hashApiKey = (key) => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Generates a random 32-byte hex string for use as an API key.
 * @returns {string} - The generated API key.
 */
const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = { hashApiKey, generateApiKey };