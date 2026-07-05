// import request from 'supertest';
// import { app } from '../app.js';

const request = require('supertest');
const { app } = require('../app');
const { describe, it, expect } = require('@jest/globals');

describe('HTTP endpoints', () => {
  it('returns the API welcome payload', async () => {
    const response = await request(app).get('/api/v1/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Welcome to the API!' });
  });

  it('logs in a seeded user', async () => {
    const response = await request(app)
      .post('/api/v1/login')
      .send({ email: 'agent', password: 'anything' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: 'agent', role: 'agent' });
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('rejects an unknown login', async () => {
    const response = await request(app)
      .post('/api/v1/login')
      .send({ email: 'missing', password: 'anything' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid email or password' });
  });

  it('returns seeded projects', async () => {
    const response = await request(app).get('/api/v1/projects');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({ id: 1, name: 'Q3 Collections Campaign' });
  });

  it('returns a 404 for a missing project', async () => {
    const response = await request(app).get('/api/v1/projects/9999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      code: 'PROJECT_NOT_FOUND',
      message: 'No project with that ID exists',
    });
  });

  it('returns seeded owners', async () => {
    const response = await request(app).get('/api/v1/owners');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.meta).toMatchObject({ total: 3, page: 1, limit: 20 });
  });
});