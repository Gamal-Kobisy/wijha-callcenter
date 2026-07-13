import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { SessionsService } from './sessions.service';
import { PrismaService } from '@/prisma/prisma.service';
import { mockSession } from '@/prisma/mock-data';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all sessions', async () => {
      prisma.userLog.findMany.mockResolvedValue([
        mockSession(),
        mockSession({ id: 2n, agentId: 2, duration: 10800 }),
      ]);

      const sessions = await service.findAll();
      expect(sessions).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('should create a new session', async () => {
      prisma.userLog.create.mockResolvedValue(mockSession({ id: 3n, startTime: new Date('2024-06-01T09:00:00Z'), duration: 3600, isActive: true }));

      const session = await service.create(
        { start_time: '2024-06-01T09:00:00Z', duration: 3600 },
        1,
      );
      expect(session.agent_id).toBe(1);
      expect(session.is_active).toBe(true);
      expect(session.duration).toBe(3600);
    });

    it('should create session without duration', async () => {
      prisma.userLog.create.mockResolvedValue(mockSession({ id: 3n, startTime: new Date('2024-06-01T09:00:00Z'), duration: null, isActive: true }));

      const session = await service.create(
        { start_time: '2024-06-01T09:00:00Z' },
        1,
      );
      expect(session.duration).toBeNull();
      expect(session.is_active).toBe(true);
    });
  });

  describe('getActiveSession', () => {
    it('should return active session if one exists', async () => {
      prisma.userLog.findFirst.mockResolvedValue(mockSession({ id: 3n, agentId: 3, duration: null, isActive: true }));

      const active = await service.getActiveSession();
      expect(active).not.toBeNull();
      expect(active!.is_active).toBe(true);
    });

    it('should return null if no active session', async () => {
      prisma.userLog.findFirst.mockResolvedValue(null);
      const active = await service.getActiveSession();
      expect(active).toBeNull();
    });
  });
});
