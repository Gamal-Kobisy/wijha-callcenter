import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { OwnersService } from './owners.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockOwner, mockNumber, mockOwnerInfo } from '../prisma/mock-data';

describe('OwnersService', () => {
  let service: OwnersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OwnersService>(OwnersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated owners', async () => {
      prisma.owner.findMany.mockResolvedValue([
        mockOwner({ name: 'John', numbers: [mockNumber()], ownerInfo: [mockOwnerInfo({ key: 'city', value: 'NYC' })] }),
      ]);
      prisma.owner.count.mockResolvedValue(1);

      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.owner.findMany.mockResolvedValue([]);
      prisma.owner.count.mockResolvedValue(0);

      const result = await service.findAll(undefined, 'inactive');
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return owner with nested relations', async () => {
      prisma.owner.findUnique.mockResolvedValue(
        mockOwner({
          name: 'John Doe',
          numbers: [mockNumber({ number: '555-0100' }), mockNumber({ number: '555-0101' })],
          ownerInfo: [mockOwnerInfo({ key: 'company', value: 'Acme Corp' })],
        }),
      );

      const owner = await service.findById(1);
      expect(owner).not.toBeNull();
      expect(owner!.name).toBe('John Doe');
      expect(owner!.numbers).toHaveLength(2);
      expect(owner!.info).toHaveLength(1);
    });

    it('should return null for non-existent id', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      expect(await service.findById(999)).toBeNull();
    });
  });

  describe('create', () => {
    it('should create owner with numbers and info', async () => {
      prisma.owner.create.mockResolvedValue(
        mockOwner({
          id: 3n, name: 'Test Owner',
          numbers: [mockNumber({ number: '555-9999' })],
          ownerInfo: [mockOwnerInfo({ key: 'city', value: 'NYC' })],
        }),
      );

      const owner = await service.create({
        name: 'Test Owner',
        project_id: 1,
        numbers: [{ number: '555-9999' }],
        info: [{ key: 'city', value: 'NYC' }],
      });
      expect(owner.name).toBe('Test Owner');
      expect(owner.numbers).toEqual([{ number: '555-9999' }]);
      expect(owner.info).toEqual([{ key: 'city', value: 'NYC' }]);
    });

    it('should default status to active', async () => {
      prisma.owner.create.mockResolvedValue(mockOwner({ id: 3n, name: 'No Status', numbers: [], ownerInfo: [] }));

      const owner = await service.create({
        name: 'No Status', project_id: 1, numbers: [{ number: '555-0000' }],
      });
      expect(owner.status).toBe('active');
    });
  });

  describe('update', () => {
    it('should update owner fields', async () => {
      prisma.owner.findUnique.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));
      prisma.owner.update.mockResolvedValue(mockOwner({ name: 'John', status: 'completed', numbers: [], ownerInfo: [] }));

      const updated = await service.update(1, { status: 'completed' });
      expect(updated.status).toBe('completed');
    });

    it('should throw NotFoundException for non-existent id', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { status: 'done' })).rejects.toThrow('Owner not found');
    });
  });

  describe('getNextOwner', () => {
    it('should return owner with lowest attempt_count and increment it', async () => {
      prisma.owner.findFirst.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));
      prisma.owner.update.mockResolvedValue(mockOwner({ name: 'John', attemptCount: 1, lastDialedAt: new Date(), numbers: [], ownerInfo: [] }));

      const next = await service.getNextOwner(1);
      expect(next).not.toBeNull();
      expect(next!.attempt_count).toBe(1);
    });
  });
});
