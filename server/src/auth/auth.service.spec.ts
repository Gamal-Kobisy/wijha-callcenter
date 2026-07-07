import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockUser } from '../prisma/mock-data';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: JwtService;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-token') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return token and user for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ email: 'agent', name: 'Agent Smith', phoneNumber: '123-456-7890' }));
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

      const result = await service.login('agent', 'agent123');
      expect(result).toHaveProperty('token', 'mock-token');
      expect(result.user).toMatchObject({
        id: 1,
        email: 'agent',
        name: 'Agent Smith',
        role: 'user',
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('nonexistent', 'password')).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ email: 'agent' }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

      await expect(service.login('agent', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('validateUser', () => {
    it('should return authenticated user for valid id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ email: 'agent' }));

      const result = await service.validateUser(1);
      expect(result).toEqual({ id: 1, email: 'agent', role: 'user' });
    });

    it('should return null for invalid id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser(999);
      expect(result).toBeNull();
    });
  });
});
