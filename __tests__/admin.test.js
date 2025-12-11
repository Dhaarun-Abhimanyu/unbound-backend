const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const CommandLog = require('../models/CommandLog');
const { hashApiKey, generateApiKey } = require('../utils/authUtils');
const mongoose = require('mongoose');

jest.mock('../models/User');
jest.mock('../models/CommandLog');
jest.mock('../utils/authUtils');

describe('Admin Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Deterministic auth/hash mocks (no call-order issues)
        hashApiKey.mockImplementation((key) => {
            if (key === 'admin_key') return 'hashed_admin_key';
            if (key === 'new_api_key') return 'unique_hashed_key';
            return 'unknown_hash';
        });

        generateApiKey.mockReturnValue('new_api_key');

        // Default mock for auth + uniqueness checks
        User.findOne.mockImplementation((query = {}) => {
            if (query.api_key === 'hashed_admin_key') {
                return Promise.resolve({ _id: 'admin1', role: 'ADMIN' });
            }
            if (query.api_key === 'unique_hashed_key') {
                return Promise.resolve(null); // No collision for new user key
            }
            if (query.username === 'bob') {
                return Promise.resolve(null); // No existing user
            }
            return Promise.resolve(null);
        });
    });

    afterAll(async () => {
        // Close mongoose connection if it exists
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    describe('POST /api/users', () => {
        it('should create a new user', async () => {
            // Mock the findOne for duplicate check
            User.findOne.mockImplementation((query) => {
                if (query.api_key === 'hashed_admin_key') {
                    return Promise.resolve({ _id: 'admin1', role: 'ADMIN' });
                }
                if (query.username === 'bob') {
                    return Promise.resolve(null); // No existing user
                }
                return Promise.resolve(null);
            });

            User.create.mockResolvedValue({ 
                _id: 'u1', 
                username: 'bob', 
                role: 'MEMBER' 
            });

            const res = await request(app)
                .post('/api/users')
                .set('x-api-key', 'admin_key')
                .send({ username: 'bob' });

            expect(res.statusCode).toBe(201);
            expect(res.body.api_key).toBe('new_api_key');
        });
    });

    describe('POST /api/users/:id/credits', () => {
        it('should update user credits', async () => {
            const mockUser = { 
                _id: 'u1', 
                credits: 10, 
                save: jest.fn().mockResolvedValue(true),
                username: 'bob' 
            };
            
            // Mock findById separately from findOne
            User.findById.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/users/u1/credits')
                .set('x-api-key', 'admin_key')
                .send({ amount: 50 });

            expect(res.statusCode).toBe(200);
            expect(mockUser.credits).toBe(60);
            expect(mockUser.save).toHaveBeenCalled();
        });
    });

    describe('GET /api/admin/system-stats', () => {
        it('should return system stats', async () => {
            CommandLog.countDocuments
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(80)  // executed
                .mockResolvedValueOnce(10)  // rejected
                .mockResolvedValueOnce(10); // pending

            const res = await request(app)
                .get('/api/admin/system-stats')
                .set('x-api-key', 'admin_key');

            expect(res.statusCode).toBe(200);
            expect(res.body.total_commands).toBe(100);
        });
    });

    describe('POST /api/admin/pending-commands/:id/process', () => {
        it('should approve pending command', async () => {
            const mockUser = { 
                _id: 'u1', 
                credits: 5, 
                save: jest.fn().mockResolvedValue(true) 
            };
            
            const mockLog = { 
                _id: 'log1', 
                status: 'PENDING_APPROVAL', 
                user_id: mockUser,
                save: jest.fn().mockResolvedValue(true)
            };

            CommandLog.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockLog)
            });

            const res = await request(app)
                .post('/api/admin/pending-commands/log1/process')
                .set('x-api-key', 'admin_key')
                .send({ action: 'APPROVE' });

            expect(res.statusCode).toBe(200);
            expect(mockLog.status).toBe('EXECUTED');
            expect(mockUser.credits).toBe(4);
            expect(mockLog.save).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled();
        });
    });
});