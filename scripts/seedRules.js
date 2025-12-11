// Seed a list of rules (action, regex, description, priority) into the DB.

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Rule = require('../models/Rule');

// Validate regex like controllers/ruleController.createRule
const isValidRegex = (pattern) => {
  try {
    // Throws if invalid
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

const rules = [
  // Linux basics
  { pattern: '^ls(\\s|$)', action: 'AUTO_ACCEPT', description: 'List directory', priority: 10 },
  { pattern: '^pwd(\\s|$)', action: 'AUTO_ACCEPT', description: 'Print working directory', priority: 10 },
  { pattern: '^cd\\s', action: 'AUTO_ACCEPT', description: 'Change directory', priority: 10 },
  { pattern: '^cat\\s', action: 'AUTO_ACCEPT', description: 'Read file', priority: 9 },
  { pattern: '^echo\\s', action: 'AUTO_ACCEPT', description: 'Echo text', priority: 9 },

  // Potentially risky operations
  { pattern: '^rm(\\s|$)', action: 'REQUIRE_APPROVAL', description: 'File deletion requires approval', priority: 50 },
  { pattern: '^rm\\s+-rf\\s+/(\\s|$)', action: 'AUTO_REJECT', description: 'Dangerous delete root', priority: 100 },
  { pattern: '^chmod\\s+7\\d\\d', action: 'REQUIRE_APPROVAL', description: 'High-permission change', priority: 60 },
  { pattern: '^chown\\s', action: 'REQUIRE_APPROVAL', description: 'Ownership changes need approval', priority: 60 },
  { pattern: '^dd\\s', action: 'REQUIRE_APPROVAL', description: 'Disk write utility', priority: 70 },

  // Networking
  { pattern: '^curl\\s', action: 'AUTO_ACCEPT', description: 'HTTP requests', priority: 8 },
  { pattern: '^wget\\s', action: 'AUTO_ACCEPT', description: 'Download files', priority: 8 },
  { pattern: '^scp\\s', action: 'REQUIRE_APPROVAL', description: 'Remote copy', priority: 55 },
  { pattern: '^ssh\\s', action: 'REQUIRE_APPROVAL', description: 'SSH connections', priority: 55 },

  // Process and system info
  { pattern: '^ps(\\s|$)', action: 'AUTO_ACCEPT', description: 'Process list', priority: 8 },
  { pattern: '^top(\\s|$)', action: 'AUTO_ACCEPT', description: 'System monitor', priority: 8 },
  { pattern: '^kill\\s', action: 'REQUIRE_APPROVAL', description: 'Terminate processes', priority: 50 },

  // Package managers
  { pattern: '^apt(-get)?\\s+install\\s', action: 'REQUIRE_APPROVAL', description: 'Install packages', priority: 50 },
  { pattern: '^apt(-get)?\\s+update(\\s|$)', action: 'AUTO_ACCEPT', description: 'Update package lists', priority: 9 },
  { pattern: '^apt(-get)?\\s+upgrade(\\s|$)', action: 'REQUIRE_APPROVAL', description: 'Upgrade packages', priority: 50 },
  { pattern: '^yum\\s+install\\s', action: 'REQUIRE_APPROVAL', description: 'Install packages (yum)', priority: 50 },

  // Docker
  { pattern: '^docker\\s+ps(\\s|$)', action: 'AUTO_ACCEPT', description: 'List containers', priority: 9 },
  { pattern: '^docker\\s+images(\\s|$)', action: 'AUTO_ACCEPT', description: 'List images', priority: 9 },
  { pattern: '^docker\\s+pull\\s', action: 'AUTO_ACCEPT', description: 'Pull image', priority: 9 },
  { pattern: '^docker\\s+run\\s', action: 'REQUIRE_APPROVAL', description: 'Run container', priority: 55 },
  { pattern: '^docker\\s+rm\\s', action: 'REQUIRE_APPROVAL', description: 'Remove container', priority: 55 },
  { pattern: '^docker\\s+rmi\\s', action: 'REQUIRE_APPROVAL', description: 'Remove image', priority: 55 },
  { pattern: '^docker\\s+system\\s+prune(\\s|$)', action: 'REQUIRE_APPROVAL', description: 'Prune system', priority: 70 },

  // Git
  { pattern: '^git\\s+status(\\s|$)', action: 'AUTO_ACCEPT', description: 'Git status', priority: 9 },
  { pattern: '^git\\s+clone\\s', action: 'AUTO_ACCEPT', description: 'Git clone', priority: 9 },
  { pattern: '^git\\s+push(\\s|$)', action: 'REQUIRE_APPROVAL', description: 'Push to remote', priority: 55 },
  { pattern: '^git\\s+reset\\s+--hard', action: 'REQUIRE_APPROVAL', description: 'Hard reset', priority: 70 },

  // System service management
  { pattern: '^systemctl\\s+status\\s', action: 'AUTO_ACCEPT', description: 'Service status', priority: 9 },
  { pattern: '^systemctl\\s+(restart|stop)\\s', action: 'REQUIRE_APPROVAL', description: 'Restart/stop services', priority: 60 },

  // Filesystem-wide operations
  { pattern: '^mkfs\\s', action: 'AUTO_REJECT', description: 'Format filesystem', priority: 100 },
  { pattern: '^mount\\s', action: 'REQUIRE_APPROVAL', description: 'Mount filesystems', priority: 60 },

  // Default safe views
  { pattern: '^whoami(\\s|$)', action: 'AUTO_ACCEPT', description: 'Current user', priority: 8 },
  { pattern: '^id(\\s|$)', action: 'AUTO_ACCEPT', description: 'User identity', priority: 8 },
];

(async () => {
  try {
    await connectDB();

    const valid = [];
    const invalid = [];

    for (const r of rules) {
      if (isValidRegex(r.pattern)) {
        valid.push(r);
      } else {
        invalid.push(r);
      }
    }

    if (invalid.length) {
      console.warn('Skipping invalid regex patterns:', invalid.map(i => i.pattern));
    }

    if (valid.length) {
      const inserted = await Rule.insertMany(valid);
      console.log(`Inserted ${inserted.length} rules.`);
    } else {
      console.log('No valid rules to insert.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed rules:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
})();