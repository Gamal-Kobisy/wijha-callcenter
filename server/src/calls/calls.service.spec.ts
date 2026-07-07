import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CallsService } from './calls.service';
import { OwnersService } from '../owners/owners.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockCallRecord, mockOwner } from '../prisma/mock-data';

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
        mockCallRecord({ duration: 120 }),
        mockCallRecord({ id: 2n, status: 'no_answer', duration: null }),
      ]);
      prisma.callDetailRecord.count.mockResolvedValue(2);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by owner_id', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([
        mockCallRecord(),
      ]);
      prisma.callDetailRecord.count.mockResolvedValue(1);

      const result = await service.findAll({ owner_id: 1 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].owner_id).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.callDetailRecord.findMany.mockResolvedValue([]);
      prisma.callDetailRecord.count.mockResolvedValue(0);

      const result = await service.findAll({ status: 'busy' });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return call by id', async () => {
      prisma.callDetailRecord.findUnique.mockResolvedValue(mockCallRecord());
      const call = await service.findById(1);
      expect(call).not.toBeNull();
      expect(call!.status).toBe('completed');
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
        { owner_id: 1, status: 'busy', time: '2024-06-01T12:00:00Z', duration: 30, agent_notes: 'Line busy' },
        1,
      );
      expect(call.status).toBe('busy');
      expect(call.agent_id).toBe(1);
    });

    it('should handle optional fields', async () => {
      prisma.callDetailRecord.create.mockResolvedValue(
        mockCallRecord({ id: 5n, ownerId: 2n, agentId: 2, status: 'no_answer', duration: null }),
      );

      const call = await service.submit(
        { owner_id: 2, status: 'no_answer', time: '2024-06-01T12:00:00Z' },
        2,
      );
      expect(call.duration).toBeNull();
      expect(call.agent_notes).toBeNull();
    });
  });

  describe('notifyCalling', () => {
    it('should not throw', async () => {
      await expect(
        service.notifyCalling({ owner_id: 1, owner_number: '555-0100' }),
      ).resolves.toBeUndefined();
    });
  });
});
