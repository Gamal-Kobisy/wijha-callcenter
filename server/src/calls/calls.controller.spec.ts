import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { OwnersService } from '@/owners/owners.service';
import { PrismaService } from '@/prisma/prisma.service';
import { mockOwner, mockNumber, mockOwnerInfo, mockCallRecord } from '@/prisma/mock-data';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

const recordWithOwner = (overrides: Record<string, unknown> = {}) => ({
  id: 1n,
  ownerId: 1n,
  agentId: 1,
  status: 'completed',
  time: new Date('2024-06-01T12:00:00Z'),
  duration: 60,
  agentNotes: null,
  owner: {
    id: 1n,
    name: 'John Doe',
    ownerProjects: [{ project: { id: 1, name: 'Default Project' } }],
  },
  ...overrides,
});

describe('CallsController', () => {
  let controller: CallsController;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    prisma.callDetailRecord.findMany.mockResolvedValue([
      recordWithOwner(),
      recordWithOwner({ id: 2n, ownerId: 2n, status: 'completed', duration: null, owner: { id: 2n, name: 'Jane Smith', ownerProjects: [{ project: { id: 2, name: 'Other Project' } }] } }),
      recordWithOwner({ id: 3n, ownerId: 3n, status: 'pending', duration: null, owner: { id: 3n, name: 'Bob Wilson', ownerProjects: [] } }),
    ]);
    prisma.callDetailRecord.count.mockResolvedValue(3);
    prisma.callDetailRecord.findUnique.mockResolvedValue(recordWithOwner());

    prisma.owner.findMany.mockResolvedValue([
      mockOwner({
        numbers: [mockNumber({ number: '555-0100' })],
        ownerInfo: [mockOwnerInfo({ key: 'email', value: 'john@example.com' })],
      }),
    ]);

    prisma.callDetailRecord.create.mockResolvedValue(recordWithOwner({ id: 4n }));

    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(prisma));

    prisma.$queryRaw.mockResolvedValue([{ id: 1n }]);
    prisma.owner.findUnique.mockResolvedValue(
      mockOwner({
        numbers: [mockNumber({ number: '555-0100' })],
        ownerInfo: [mockOwnerInfo({ key: 'email', value: 'john@example.com' })],
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CallsController],
      providers: [
        CallsService,
        OwnersService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CallsController>(CallsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /calls', () => {
    it('should return all calls', async () => {
      const result = await controller.findAll({});
      expect(result.data).toHaveLength(3);
    });

    it('should filter by owner_id', async () => {
      const result = await controller.findAll({ owner_id: '1' });
      expect(result.data).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const result = await controller.findAll({ status: 'completed' });
      expect(result.data).toHaveLength(3);
    });
  });

  describe('POST /calls', () => {
    it('should submit a call', async () => {
      const user = { id: 1, email: 'agent', role: 'user' as const };
      const result = await controller.submit(
        {
          owner_id: 1,
          status: 'completed',
          time: '2024-06-01T12:00:00Z',
          duration: 60,
          project_id: 1,
        },
        user,
      );

      expect(result.owner_id).toBe(1);
      expect(result.agent_id).toBe(1);
      expect(result.status).toBe('completed');
    });
  });

  describe('GET /calls/next', () => {
    it('should return next owner with past calls', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        mockCallRecord({ id: 1n, ownerId: 1n, status: 'completed', time: new Date('2024-05-01T10:00:00Z'), owner: { ownerProjects: [{ project: { id: 1, name: 'Default Project' } }] } }),
        mockCallRecord({ id: 2n, ownerId: 1n, status: 'no_answer', time: new Date('2024-05-02T14:00:00Z'), owner: { ownerProjects: [{ project: { id: 1, name: 'Default Project' } }] } }),
      ]);

      const result = await controller.getNext({ project_id: '1' });
      expect(result).not.toBeNull();
      expect(result!.owner.id).toBe(1);
      expect(result!.owner.name).toBe('John Doe');
      expect(result!.owner.phones).toHaveLength(1);
      expect(result!.calls).toHaveLength(2);
      expect(result!.calls[0].status).toBe('completed');
    });

    it('should pass date query param to service', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([]);

      const result = await controller.getNext({ project_id: '1', date: '2024-06-01' });
      expect(result).not.toBeNull();
    });
  });

  describe('GET /calls/statuses', () => {
    it('should return status counts', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        { status: 'completed' } as any,
        { status: 'no_answer' } as any,
      ]);
      (prisma.callDetailRecord.groupBy as jest.Mock).mockResolvedValue([
        { status: 'completed', _count: 3 },
        { status: 'no_answer', _count: 1 },
      ]);

      const result = await controller.getStatuses({});
      expect(result).toEqual([
        { status: 'completed', count: 3 },
        { status: 'no_answer', count: 1 },
      ]);
    });

    it('should pass from/to query params', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        { status: 'completed' } as any,
      ]);
      (prisma.callDetailRecord.groupBy as jest.Mock).mockResolvedValue([
        { status: 'completed', _count: 2 },
      ]);

      const result = await controller.getStatuses({ from: '2024-01-01T00:00:00Z', to: '2024-12-31T23:59:59Z' });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
      expect(result[0].count).toBe(2);
    });
  });

  describe('POST /calls/calling', () => {
    it('should notify calling', async () => {
      await expect(
        controller.notifyCalling({ owner_id: 1, project_id: 1 }),
      ).resolves.toBeUndefined();
    });
  });

  describe('GET /calls/:callId', () => {
    it('should return call by id', async () => {
      const result = await controller.findOne(1);
      expect(result).not.toBeNull();
      expect(result!.status).toBe('completed');
    });

    it('should return null for non-existent', async () => {
      prisma.callDetailRecord.findUnique.mockResolvedValue(null);
      const result = await controller.findOne(999);
      expect(result).toBeNull();
    });
  });
});
