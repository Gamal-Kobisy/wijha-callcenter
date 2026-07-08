import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockUser } from '../prisma/mock-data';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    prisma.user.findUnique.mockResolvedValue(mockUser({ email: 'agent', name: 'Agent' }));
    (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      const result = await controller.login({ email: 'agent', password: 'agent123' });
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('agent');
    });

    it('should throw on invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(controller.login({ email: 'nonexistent', password: 'wrong' })).rejects.toThrow();
    });
  });

  describe('POST /logout', () => {
    it('should return logout message', () => {
      const user = { id: 1, email: 'agent', role: 'user' as const };
      const result = controller.logout(user);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('GET /me', () => {
    it('should return authenticated user', () => {
      const user = { id: 1, email: 'agent', role: 'user' as const };
      const result = controller.getMe(user);
      expect(result).toEqual(user);
    });
  });
});
