import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockSession } from '../prisma/mock-data';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('SessionsController', () => {
  let controller: SessionsController;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    prisma.userLog.findMany.mockResolvedValue([
      mockSession(),
      mockSession({ id: 2n, agentId: 2, duration: 10800 }),
    ]);
    prisma.userLog.create.mockResolvedValue(
      mockSession({ id: 3n, startTime: new Date('2024-06-01T09:00:00Z'), duration: 3600, isActive: true }),
    );
    prisma.userLog.findFirst.mockResolvedValue(
      mockSession({ id: 3n, agentId: 3, duration: null, isActive: true }),
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionsController>(SessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /sessions', () => {
    it('should return all sessions', async () => {
      const result = await controller.findAll({});
      expect(result).toHaveLength(2);
    });
  });

  describe('POST /sessions', () => {
    it('should create a session', async () => {
      const user = { id: 1, email: 'agent', role: 'user' as const };
      const result = await controller.create(
        { start_time: '2024-06-01T09:00:00Z' },
        user,
      );

      expect(result.agent_id).toBe(1);
      expect(result.is_active).toBe(true);
    });
  });

  describe('POST /sessions/active', () => {
    it('should return 200 when active session exists', async () => {
      await controller.create(
        { start_time: '2024-06-01T09:00:00Z' },
        { id: 3, email: 'test', role: 'user' },
      );

      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
      await controller.active(res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 204 when no active session', async () => {
      const prisma2 = mockDeep<PrismaService>();
      prisma2.userLog.findFirst.mockResolvedValue(null);
      prisma2.userLog.findMany.mockResolvedValue([]);
      prisma2.userLog.create.mockResolvedValue(
        mockSession({ id: 3n, duration: null, isActive: true }),
      );

      const module: TestingModule = await Test.createTestingModule({
        controllers: [SessionsController],
        providers: [
          SessionsService,
          { provide: PrismaService, useValue: prisma2 },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const ctrl = module.get<SessionsController>(SessionsController);
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as any;
      await ctrl.active(res);

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
