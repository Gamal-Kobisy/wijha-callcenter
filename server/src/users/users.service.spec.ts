import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockUser, mockCallRecord, mockSession } from '../prisma/mock-data';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users when no role filter', async () => {
      prisma.user.findMany.mockResolvedValue([
        mockUser({ id: 1, email: 'agent', name: 'Agent' }),
        mockUser({ id: 2, email: 'admin', name: 'Admin', role: 'admin' }),
      ]);
      const users = await service.findAll();
      expect(users).toHaveLength(2);
    });

    it('should filter by role', async () => {
      prisma.user.findMany.mockResolvedValue([
        mockUser({ id: 2, email: 'admin', name: 'Admin', role: 'admin' }),
      ]);
      const admins = await service.findAll('admin');
      expect(admins).toHaveLength(1);
      expect(admins[0].role).toBe('admin');
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ email: 'agent', name: 'Agent' }));
      const user = await service.findById(1);
      expect(user).not.toBeNull();
      expect(user!.email).toBe('agent');
    });

    it('should return null for non-existent id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.findById(999)).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      prisma.user.create.mockResolvedValue(mockUser({ id: 3, email: 'newuser@test.com', name: 'New User', phoneNumber: '555-0000' }));
      const user = await service.create({
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        phone_number: '555-0000',
        role: 'user',
      });
      expect(user.id).toBe(3);
      expect(user.email).toBe('newuser@test.com');
    });

    it('should throw ConflictException for duplicate email', async () => {
      const prismaError = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
        'Unique constraint failed', { code: 'P2002', clientVersion: '7.8.0' },
      );
      prisma.user.create.mockRejectedValue(prismaError);

      await expect(
        service.create({ email: 'agent', password: 'password123', role: 'user' }),
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ email: 'agent', name: 'Agent' }));
      prisma.user.update.mockResolvedValue(mockUser({ email: 'agent', name: 'Updated Name' }));
      const updated = await service.update(1, { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');
    });

    it('should throw NotFoundException for non-existent id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: 'Nope' })).rejects.toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete existing user', async () => {
      prisma.user.delete.mockResolvedValue(mockUser());
      expect(await service.delete(1)).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const prismaError = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
        'Record not found', { code: 'P2025', clientVersion: '7.8.0' },
      );
      prisma.user.delete.mockRejectedValue(prismaError);
      expect(await service.delete(999)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return stats for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ email: 'agent', name: 'Agent' }));
      prisma.callDetailRecord.findMany.mockResolvedValue([
        mockCallRecord({ status: 'completed', duration: 120 }),
        mockCallRecord({ id: 2n, status: 'no_answer', duration: null }),
      ]);
      prisma.userLog.findMany.mockResolvedValue([
        mockSession({ duration: 3600 }),
      ]);

      const stats = await service.getStats(1);
      expect(stats).not.toBeNull();
      expect(stats!.total_calls).toBe(2);
      expect(stats!.answered).toBe(1);
      expect(stats!.no_answer).toBe(1);
      expect(stats!.avg_duration_seconds).toBe(60);
      expect(stats!.total_session_time_seconds).toBe(3600);
    });

    it('should return null for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.getStats(999)).toBeNull();
    });
  });
});
