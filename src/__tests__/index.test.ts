import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import sequelize from '../database';
import { app } from '../index';

// Conectar ao banco de dados antes de executar os testes
beforeAll(async () => {
    await sequelize.sync({ force: true });
});

// Testes para registro e login
describe('Auth Routes', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/register')
            .send({ username: 'testuser', password: 'testpass' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Usuário criado com sucesso');
    });

    it('should login a user', async () => {
        const response = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'testpass' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });
});

// Testes para download
describe('Download Routes', () => {
    let token: string;

    beforeAll(async () => {
        // Registrar e fazer login para obter um token
        await request(app).post('/register').send({ username: 'testuser', password: 'testpass' });
        const loginResponse = await request(app)
            .post('/login')
            .send({ username: 'testuser', password: 'testpass' });
        token = loginResponse.body.token;
    });

    it('should download a file and save the history', async () => {
        const response = await request(app)
            .post('/download')
            .set('Authorization', `Bearer ${token}`)
            .send({ url: 'https://example.com/testfile.zip' });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('url');
    });

    it('should return 400 for invalid URL', async () => {
        const response = await request(app)
            .post('/download')
            .set('Authorization', `Bearer ${token}`)
            .send({ url: 'invalid-url' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('URL inválida');
    });
});
