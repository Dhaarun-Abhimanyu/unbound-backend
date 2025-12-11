const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Rule = require('../models/Rule');
const { hashApiKey } = require('../utils/authUtils');
const mongoose = require('mongoose');

jest.mock('../models/User');
jest.mock('../models/Rule');
jest.mock('../utils/authUtils');

describe('Rule Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup Admin Auth
        hashApiKey.mockReturnValue('hashed_admin_key');
        User.findOne.mockResolvedValue({
            _id: 'admin123',
            role: 'ADMIN'
        });
    });

    describe('GET /api/rules', () => {
        it('should list all rules', async () => {
            const mockRules = [{ pattern: 'rm', action: 'AUTO_REJECT' }];
            Rule.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockRules) });

            const res = await request(app)
                .get('/api/rules')
                .set('x-api-key', 'admin_key');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockRules);
        });
    });

    describe('POST /api/rules', () => {
        it('should create a valid rule', async () => {
            Rule.create.mockResolvedValue({ _id: 'rule1', pattern: 'git' });

            const res = await request(app)
                .post('/api/rules')
                .set('x-api-key', 'admin_key')
                .send({ pattern: 'git', action: 'AUTO_ACCEPT' });

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Rule created successfully');
        });

        it('should reject invalid regex', async () => {
            const res = await request(app)
                .post('/api/rules')
                .set('x-api-key', 'admin_key')
                .send({ pattern: '(', action: 'AUTO_ACCEPT' }); // Invalid regex

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Invalid Regular Expression');
        });
    });

    describe('DELETE /api/rules/:id', () => {
        it('should delete a rule', async () => {
            Rule.findByIdAndDelete.mockResolvedValue({ _id: 'rule1' });

            const res = await request(app)
                .delete('/api/rules/rule1')
                .set('x-api-key', 'admin_key');

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Rule deleted successfully');
        });
    });
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
});