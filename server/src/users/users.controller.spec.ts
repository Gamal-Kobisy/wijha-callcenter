import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockUser } from '../prisma/mock-data';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    prisma.user.findMany.mockResolvedValue([
      mockUser({ id: 1, email: 'agent', name: 'Agent Smith', phoneNumber: '123-456-7890' }),
      mockUser({ id: 2, email: 'admin', name: 'Admin User', role: 'admin', phoneNumber: '' }),
    ]);
    prisma.user.findUnique.mockResolvedValue(
      mockUser({ id: 1, email: 'agent', name: 'Agent Smith', phoneNumber: '123-456-7890' }),
    );
    prisma.user.create.mockResolvedValue(mockUser({ id: 3, email: 'test@test.com', name: 'Test', phoneNumber: '555-0000' }));
    prisma.user.update.mockResolvedValue(mockUser({ id: 1, email: 'agent', name: 'Updated' }));
    prisma.user.delete.mockResolvedValue(mockUser({ id: 1, email: 'agent', name: 'Deleted' }));
    prisma.callDetailRecord.count.mockResolvedValue(0);
    prisma.callDetailRecord.findMany.mockResolvedValue([]);
    prisma.userLog.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveLength(2);
    });

    it('should filter by role', async () => {
      prisma.user.findMany.mockResolvedValue([
        mockUser({ id: 2, email: 'admin', name: 'Admin User', role: 'admin', phoneNumber: '' }),
      ]);
      const result = await controller.findAll({ role: 'admin' });
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const result = await controller.create({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test',
        phone: '555-0000',
        role: 'user',
      });
      expect(result.id).toBe(3);
      expect(result.email).toBe('test@test.com');
    });
  });

  describe('GET /users/:userId', () => {
    it('should return user by id', async () => {
      const result = await controller.findOne(1);
      expect(result).not.toBeNull();
      expect(result!.email).toBe('agent');
    });

    it('should return null for non-existent', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await controller.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('PATCH /users/:userId', () => {
    it('should update user', async () => {
      const result = await controller.update(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('DELETE /users/:userId', () => {
    it('should delete user', async () => {
      await expect(controller.remove(1)).resolves.toBeUndefined();
    });
  });

  describe('GET /users/:userId/stats', () => {
    it('should return user stats', async () => {
      const result = await controller.getStats(1);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('total_calls');
    });
  });
});
