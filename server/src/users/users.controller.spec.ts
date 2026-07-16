import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SessionsService } from '@/sessions/sessions.service';
import { mockUser } from '@/prisma/mock-data';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let prisma: DeepMockProxy<PrismaService>;
  let sessionsService: DeepMockProxy<SessionsService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    sessionsService = mockDeep<SessionsService>();
    sessionsService.findAll.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    prisma.activeSession.findMany.mockResolvedValue([{ agentId: 1, firstBeat: new Date() }]);
    prisma.activeSession.findUnique.mockResolvedValue({ agentId: 1, firstBeat: new Date() });
    prisma.user.findMany.mockResolvedValue([
      mockUser({ id: 1, email: 'agent', name: 'Agent Smith', phoneNumber: '123-456-7890' }),
      mockUser({ id: 2, email: 'admin', name: 'Admin User', role: 'admin', phoneNumber: '' }),
    ]);
    prisma.user.findUnique.mockResolvedValue(
      mockUser({ id: 1, email: 'agent', name: 'Agent Smith', phoneNumber: '123-456-7890' }),
    );
    prisma.user.create.mockResolvedValue(mockUser({ id: 3, email: 'test@test.com', name: 'Test', phoneNumber: '555-0000' }));
    prisma.user.update.mockResolvedValue(mockUser({ id: 1, email: 'agent', name: 'Updated' }));
    prisma.callDetailRecord.count.mockResolvedValue(0);
    prisma.callDetailRecord.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: SessionsService, useValue: sessionsService },
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
      expect(result[0].is_online).toBe(true);
      expect(result[1].is_online).toBe(false);
    });

    it('should filter by role', async () => {
      prisma.user.findMany.mockResolvedValue([
        mockUser({ id: 2, email: 'admin', name: 'Admin User', role: 'admin', phoneNumber: '' }),
      ]);
      const result = await controller.findAll({ role: 'admin' });
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
      expect(result[0].is_online).toBe(false);
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
      expect(result.is_online).toBe(false);
    });
  });

  describe('POST /users/bulk', () => {
    it('should create multiple users', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.create
        .mockResolvedValueOnce(
          mockUser({ id: 3, email: 'alice@test.com', name: 'Alice' }),
        )
        .mockResolvedValueOnce(
          mockUser({ id: 4, email: 'bob@test.com', name: 'Bob' }),
        );

      const result = await controller.createBulk({
        users: [
          { email: 'alice@test.com', password: 'pass123', name: 'Alice', role: 'user' },
          { email: 'bob@test.com', password: 'pass456', name: 'Bob', role: 'user' },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('alice@test.com');
      expect(result[0].is_online).toBe(false);
      expect(result[1].email).toBe('bob@test.com');
      expect(result[1].is_online).toBe(false);
    });
  });

  describe('GET /users/:userId', () => {
    it('should return user by id', async () => {
      const result = await controller.findOne(1);
      expect(result).not.toBeNull();
      expect(result!.email).toBe('agent');
      expect(result!.is_online).toBe(true);
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
      expect(result.is_online).toBe(false);
    });
  });

  describe('DELETE /users/:userId', () => {
    it('should deactivate user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser());
      prisma.user.update.mockResolvedValue(mockUser({ role: 'deactivated' }));
      const result = await controller.remove(1);
      expect(result.role).toBe('deactivated');
      expect(result.is_online).toBe(false);
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
