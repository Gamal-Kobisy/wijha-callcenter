/**
 * E2E Test Harness
 *
 * Provides setupE2E() and teardownE2E() functions for bootstrapping and tearing down
 * a full NestJS application instance for end-to-end testing.
 *
 * The harness:
 *   1. Sets required environment variables (DATABASE_URL, JWT_SECRET, etc.)
 *   2. Creates a NestJS TestingModule from AppModule
 *   3. Creates a Nest application with global prefix 'api/v1' and ValidationPipe
 *   4. Connects to PostgreSQL via PrismaService
 *   5. Returns a TestApp object containing:
 *      - app: supertest agent for making HTTP requests
 *      - prisma: PrismaService instance for direct DB access (seeding/cleanup)
 *      - module: TestingModule for graceful teardown
 *
 * Usage in test files:
 *   const ctx = await setupE2E();
 *   const { app, prisma, module: testModule } = ctx;
 *   await teardownE2E({ app, prisma, module: testModule });
 */

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { AppModule } from '@/app.module';
import request from 'supertest';

/**
 * Shape of the test application context returned by setupE2E().
 * - app: supertest SuperTest instance for HTTP requests
 * - prisma: PrismaService for direct database manipulation
 * - module: TestingModule for teardown (must be passed to teardownE2E)
 */
export interface TestApp {
  app: ReturnType<typeof request>;
  prisma: PrismaService;
  module: TestingModule;
}

/**
 * Boots a full NestJS application for E2E testing.
 *
 * Sets environment variables with sensible defaults so tests can run
 * without a full .env file. The DATABASE_URL from the environment or
 * .env file takes precedence over the fallback.
 *
 * @returns TestApp containing supertest agent, PrismaService, and TestingModule
 */
export async function setupE2E(): Promise<TestApp> {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://myuser:mypassword@localhost:5432/e2e';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
  process.env.PORT = process.env.PORT || '3001';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  const prisma = module.get<PrismaService>(PrismaService);
  await prisma.$connect();

  return {
    app: request(app.getHttpServer()),
    prisma,
    module,
  };
}

/**
 * Tears down the E2E test application.
 *
 * Disconnects from the database and closes the NestJS module to prevent
 * open handles and connection leaks. Always pass the real module reference
 * obtained from setupE2E() — never pass an empty object.
 *
 * @param ctx - The TestApp from setupE2E()
 */
export async function teardownE2E(ctx: TestApp): Promise<void> {
  await ctx.prisma.$disconnect();
  await ctx.module.close();
}
