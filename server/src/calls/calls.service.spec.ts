import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CallsService } from './calls.service';
import { OwnersService } from '@/owners/owners.service';
import { PrismaService } from '@/prisma/prisma.service';
import { mockCallRecord } from '@/prisma/mock-data';

const withProjects = (overrides: Record<string, unknown> = {}) => ({
  client: {
    clientProjects: [
      { project: { id: 1, name: 'Default Project' } },
    ],
  },
  ...overrides,
});

describe('CallsService', () => {
  let service: CallsService;
  let prisma: DeepMockProxy<PrismaService>;
  let ownersService: OwnersService;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallsService,
        { provide: PrismaService, useValue: prisma },
        OwnersService,
      ],
    }).compile();

    service = module.get<CallsService>(CallsService);
    prisma = module.get(PrismaService);
    ownersService = module.get<OwnersService>(OwnersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all calls', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        mockCallRecord({ duration: 120, ...withProjects() }),
        mockCallRecord({ id: 2n, status: 'no_answer', duration: null, ...withProjects() }),
      ]);
      prisma.callDetailRecord.count.mockResolvedValue(2);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.data[0].projects).toEqual([{ id: 1, name: 'Default Project' }]);
    });

    it('should filter by client_id', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        mockCallRecord({ ...withProjects() }),
      ]);
      prisma.callDetailRecord.count.mockResolvedValue(1);

      const result = await service.findAll({ client_id: 1 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].client_id).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([]);
      prisma.callDetailRecord.count.mockResolvedValue(0);

      const result = await service.findAll({ status: 'busy' });
      expect(result.data).toHaveLength(0);
    });

    it('should filter by from/to date range', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');
      prisma.callDetailRecord.findMany.mockResolvedValue([mockCallRecord({ ...withProjects() })]);
      prisma.callDetailRecord.count.mockResolvedValue(1);

      const result = await service.findAll({ from, to });
      expect(result.data).toHaveLength(1);
      expect(prisma.callDetailRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            time: { gte: from, lte: to },
          }),
        }),
      );
    });

    it('should filter by agent_id', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        mockCallRecord({ agentId: 2, ...withProjects() }),
      ]);
      prisma.callDetailRecord.count.mockResolvedValue(1);

      const result = await service.findAll({ agent_id: 2 });
      expect(result.data).toHaveLength(1);
      expect(prisma.callDetailRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ agentId: 2 }),
        }),
      );
    });

    it('should filter by project_id through client projects', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([mockCallRecord({ ...withProjects() })]);
      prisma.callDetailRecord.count.mockResolvedValue(1);

      const result = await service.findAll({ project_id: 1 });
      expect(result.data).toHaveLength(1);
      expect(prisma.callDetailRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            client: { clientProjects: { some: { projectId: 1 } } },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return call by id', async () => {
      prisma.callDetailRecord.findUnique.mockResolvedValue(mockCallRecord({ ...withProjects() }));
      const call = await service.findById(1);
      expect(call).not.toBeNull();
      expect(call!.status).toBe('completed');
      expect(call!.projects).toEqual([{ id: 1, name: 'Default Project' }]);
    });

    it('should return null for non-existent id', async () => {
      prisma.callDetailRecord.findUnique.mockResolvedValue(null);
      expect(await service.findById(999)).toBeNull();
    });
  });

  describe('submit', () => {
    it('should create a new call record', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 4n, status: 'busy', duration: 30 }),
      );

      const call = await service.submit(
        { client_id: 1, status: 'busy', time: '2024-06-01T12:00:00Z', duration: 30, agent_notes: 'Line busy', project_id: 1 },
        1,
      );
      expect(call.status).toBe('busy');
      expect(call.agent_id).toBe(1);
      expect(call.projects).toEqual([]);
    });

    it('should handle optional fields', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 5n, clientId: 2n, agentId: 2, status: 'no_answer', duration: null }),
      );

      const call = await service.submit(
        { client_id: 2, status: 'no_answer', time: '2024-06-01T12:00:00Z', project_id: 1 },
        2,
      );
      expect(call.duration).toBeNull();
      expect(call.agent_notes).toBeNull();
      expect(call.projects).toEqual([]);
    });

    it('should update ClientProject status and lastDialedAt', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 6n, status: 'answered' }),
      );

      await service.submit(
        { client_id: 1, status: 'answered', time: '2024-06-01T12:00:00Z', project_id: 1 },
        1,
      );

      expect(prisma.clientProject.update).toHaveBeenCalledWith({
        where: { clientId_projectId: { clientId: 1, projectId: 1 } },
        data: { status: 'answered', lastDialedAt: expect.any(Date) },
      });
    });

    it('should set Client.nextDialAt to NOW() for non-callback status', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 7n, status: 'no_answer' }),
      );

      await service.submit(
        { client_id: 1, status: 'no_answer', time: '2024-06-01T12:00:00Z', project_id: 1 },
        1,
      );

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nextDialAt: expect.any(Date) },
      });
    });

    it('should set Client.nextDialAt to callback time when status is callback', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 8n, status: 'callback' }),
      );
      const callbackTime = '2024-06-05T14:00:00Z';

      await service.submit(
        { client_id: 1, status: 'callback', time: '2024-06-01T12:00:00Z', project_id: 1, next_dial_at: callbackTime },
        1,
      );

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nextDialAt: new Date(callbackTime) },
      });
    });

    it('should mark client as inactive when status is not_interested', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 9n, status: 'not_interested' }),
      );
      jest.spyOn(ownersService, 'update').mockResolvedValue({
        id: 1, name: 'John', type: 'inactive', next_dial_at: null, phones: [], info: [],
      });

      await service.submit(
        { client_id: 1, status: 'not_interested', time: '2024-06-01T12:00:00Z', project_id: 1 },
        1,
      );

      expect(ownersService.update).toHaveBeenCalledWith(1, { type: 'inactive' });
    });

    it('should mark client as inactive when status is contacted', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 10n, status: 'contacted' }),
      );
      jest.spyOn(ownersService, 'update').mockResolvedValue({
        id: 1, name: 'John', type: 'inactive', next_dial_at: null, phones: [], info: [],
      });

      await service.submit(
        { client_id: 1, status: 'contacted', time: '2024-06-01T12:00:00Z', project_id: 1 },
        1,
      );

      expect(ownersService.update).toHaveBeenCalledWith(1, { type: 'inactive' });
    });

    it('should NOT mark client inactive for other statuses', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 11n, status: 'busy' }),
      );
      const updateSpy = jest.spyOn(ownersService, 'update');

      await service.submit(
        { client_id: 1, status: 'busy', time: '2024-06-01T12:00:00Z', project_id: 1 },
        1,
      );

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('getNextOwner', () => {
    it('should return owner with past calls', async () => {
      jest.spyOn(ownersService, 'getNextOwner').mockResolvedValue({
        id: 1,
        name: 'John Doe',
        next_dial_at: null,
        phones: [{ phone: '555-0100' }],
        info: [{ key: 'email', value: 'john@example.com' }],
      });

      prisma.callDetailRecord.findMany.mockResolvedValue([
        mockCallRecord({ id: 1n, clientId: 1n, status: 'completed', time: new Date('2024-05-01T10:00:00Z'), ...withProjects() }),
      ]);

      const result = await service.getNextOwner({ projectId: 1 });
      expect(result).not.toBeNull();
      expect(result!.owner.name).toBe('John Doe');
      expect(result!.calls).toHaveLength(1);
      expect(result!.calls[0].status).toBe('completed');
      expect(result!.calls[0].projects).toEqual([{ id: 1, name: 'Default Project' }]);
    });

    it('should return null when no owner available', async () => {
      jest.spyOn(ownersService, 'getNextOwner').mockResolvedValue(null);
      const result = await service.getNextOwner({ projectId: 1 });
      expect(result).toBeNull();
    });

    it('should pass date filter to ownersService', async () => {
      const date = new Date('2024-06-01');
      const getNextOwnerSpy = jest.spyOn(ownersService, 'getNextOwner').mockResolvedValue({
        id: 1,
        name: 'Scheduled Owner',
        next_dial_at: date.toISOString(),
        phones: [],
        info: [],
      });

      prisma.callDetailRecord.findMany.mockResolvedValue([]);

      const result = await service.getNextOwner({ projectId: 1, date });
      expect(result).not.toBeNull();
      expect(getNextOwnerSpy).toHaveBeenCalledWith({ projectId: 1, date });
    });
  });

  describe('getStatusCounts', () => {
    it('should return distinct normalized statuses with counts', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        { status: 'completed' } as any,
        { status: 'no_answer' } as any,
        { status: ' busy ' } as any,
        { status: 'COMPLETED' } as any,
      ]);
      (prisma.callDetailRecord.groupBy as jest.Mock).mockResolvedValue([
        { status: 'completed', _count: 5 },
        { status: 'no_answer', _count: 3 },
        { status: ' busy ', _count: 2 },
        { status: 'COMPLETED', _count: 1 },
      ]);

      const result = await service.getStatusCounts();
      expect(result).toEqual([
        { status: 'busy', count: 2 },
        { status: 'completed', count: 6 },
        { status: 'no_answer', count: 3 },
      ]);
    });

    it('should filter counts by time range', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        { status: 'completed' } as any,
        { status: 'no_answer' } as any,
      ]);
      (prisma.callDetailRecord.groupBy as jest.Mock).mockResolvedValue([
        { status: 'completed', _count: 2 },
      ]);

      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');
      const result = await service.getStatusCounts(from, to);

      expect(result).toEqual([
        { status: 'completed', count: 2 },
        { status: 'no_answer', count: 0 },
      ]);
      expect(prisma.callDetailRecord.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            time: { gte: from, lte: to },
          }),
        }),
      );
    });

    it('should return empty array when no records exist', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([] as any);
      (prisma.callDetailRecord.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await service.getStatusCounts();
      expect(result).toEqual([]);
    });
  });

  describe('notifyCalling', () => {
    it('should not throw', async () => {
      await expect(
        service.notifyCalling({ client_id: 1, client_number: '555-0100', project_id: 1 }),
      ).resolves.toBeUndefined();
    });

    it('should update Client.nextDialAt', async () => {
      await service.notifyCalling({ client_id: 1, project_id: 1 });

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nextDialAt: expect.any(Date) },
      });
    });

    it('should update ClientProject lastDialedAt and increment attemptCount', async () => {
      await service.notifyCalling({ client_id: 1, project_id: 1 });

      expect(prisma.clientProject.update).toHaveBeenCalledWith({
        where: { clientId_projectId: { clientId: 1, projectId: 1 } },
        data: { lastDialedAt: expect.any(Date), attemptCount: { increment: 1 } },
      });
    });

    it('should filter by client_number when provided', async () => {
      await service.notifyCalling({ client_id: 1, client_number: '555-0100', project_id: 1 });

      expect(prisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, numbers: { some: { number: '555-0100' } } },
        }),
      );
    });
  });
});
