// Create an admin user, store hashed API key, and print the raw API key once.

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const { generateApiKey, hashApiKey } = require('../utils/authUtils');

(async () => {
  try {
    await connectDB();

    const username = process.argv[2] || 'admin';
    // Ensure unique username
    const existing = await User.findOne({ username });
    if (existing) {
      console.log(`Admin user "${username}" already exists. Exiting.`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Generate and hash
    const rawApiKey = generateApiKey();
    const hashed = hashApiKey(rawApiKey);

    const admin = await User.create({
      username,
      api_key: hashed,
      role: 'ADMIN',
      credits: 0,
    });

    console.log('Admin user created:');
    console.log(`- _id: ${admin._id}`);
    console.log(`- username: ${admin.username}`);
    console.log(`- role: ${admin.role}`);
    console.log('IMPORTANT: Save this API key now (it is not stored in plaintext):');
    console.log(`- api_key (RAW): ${rawApiKey}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
})();