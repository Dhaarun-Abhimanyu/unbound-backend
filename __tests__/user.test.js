const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const CommandLog = require('../models/CommandLog');
const Rule = require('../models/Rule');
const { hashApiKey } = require('../utils/authUtils');
const mongoose = require('mongoose');

// Mock Mongoose Models and Utils
jest.mock('../models/User');
jest.mock('../models/CommandLog');
jest.mock('../models/Rule');
jest.mock('../utils/authUtils');

describe('User Routes', () => {
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockUser = {
            _id: 'user123',
            username: 'testuser',
            role: 'MEMBER',
            credits: 10,
            save: jest.fn()
        };

        // Setup Auth Mock
        hashApiKey.mockReturnValue('hashed_key');
        User.findOne.mockResolvedValue(mockUser);
    });

    describe('POST /api/commands', () => {
        it('should execute command if user has credits', async () => {
            // Fix: Mock chainable query .find().sort()
            // Rule.find() returns an object with a .sort() method
            Rule.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([]) // .sort() resolves to empty array (default accept)
            });
            
            CommandLog.create.mockResolvedValue({});

            const res = await request(app)
                .post('/api/commands')
                .set('x-api-key', 'valid_key')
                .send({ command: 'ls -la' });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('EXECUTED');
            expect(mockUser.credits).toBe(9); // 10 - 1
        });

        it('should return 403 if insufficient credits', async () => {
            mockUser.credits = 0;
            User.findOne.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/commands')
                .set('x-api-key', 'valid_key')
                .send({ command: 'ls -la' });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('Insufficient credits');
        });
    });

    describe('GET /api/commands/history', () => {
        it('should return command history', async () => {
            const mockLogs = [{ command_text: 'ls', status: 'EXECUTED' }];
            
            // Mock chainable query .find().sort()
            const mockSort = jest.fn().mockResolvedValue(mockLogs);
            CommandLog.find.mockReturnValue({ sort: mockSort });

            const res = await request(app)
                .get('/api/commands/history')
                .set('x-api-key', 'valid_key');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockLogs);
        });
    });

    describe('GET /api/commands/profile', () => {
        it('should return user profile', async () => {
            const res = await request(app)
                .get('/api/commands/profile')
                .set('x-api-key', 'valid_key');

            expect(res.statusCode).toBe(200);
            expect(res.body.username).toBe('testuser');
            expect(res.body.credits).toBe(10);
        });
    });
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});