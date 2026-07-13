import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { OwnersService } from './owners.service';
import { PrismaService } from '@/prisma/prisma.service';
import { mockOwner, mockNumber, mockOwnerInfo, mockProject } from '@/prisma/mock-data';

describe('OwnersService', () => {
  let service: OwnersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
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

    it('should filter by project_id', async () => {
      prisma.owner.findMany.mockResolvedValue([
        mockOwner({ name: 'Project Owner', numbers: [], ownerInfo: [] }),
      ]);
      prisma.owner.count.mockResolvedValue(1);

      const result = await service.findAll(1);
      expect(result.data).toHaveLength(1);
      expect(prisma.owner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ownerProjects: { some: { projectId: 1 } },
          }),
        }),
      );
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
      expect(owner!.phones).toHaveLength(2);
      expect(owner!.info).toHaveLength(1);
    });

    it('should return null for non-existent id', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      expect(await service.findById(999)).toBeNull();
    });
  });

  describe('create', () => {
    it('should create owner with numbers and info', async () => {
      prisma.number.findFirst.mockResolvedValue(null);
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
        phones: [{ phone: '555-9999' }],
        info: [{ key: 'city', value: 'NYC' }],
      });
      expect(owner.name).toBe('Test Owner');
      expect(owner.phones).toEqual([{ phone: '555-9999' }]);
      expect(owner.info).toEqual([{ key: 'city', value: 'NYC' }]);
    });

    it('should default status to active', async () => {
      prisma.number.findFirst.mockResolvedValue(null);
      prisma.owner.create.mockResolvedValue(mockOwner({ id: 3n, name: 'No Status', numbers: [], ownerInfo: [] }));

      const owner = await service.create({
        name: 'No Status', project_id: 1, phones: [{ phone: '555-0000' }],
      });
      expect(owner.status).toBe('active');
    });

    it('should merge into existing owner when number already exists (longer name wins)', async () => {
      const existingOwner = mockOwner({
        id: 2n, name: 'Existing Jane',
        numbers: [mockNumber({ number: '555-9999' })],
        ownerInfo: [],
      });
      prisma.number.findFirst.mockResolvedValue({
        number: '555-9999',
        ownerId: 2n,
        owner: existingOwner,
      } as any);
      prisma.owner.update.mockResolvedValue(
        mockOwner({
          id: 2n, name: 'Existing Jane',
          numbers: [mockNumber({ number: '555-9999' })],
          ownerInfo: [],
        }),
      );

      const result = await service.create({
        name: 'New Guy',
        project_id: 1,
        phones: [{ phone: '555-9999' }],
      });

      expect(result.name).toBe('Existing Jane');
      expect(prisma.owner.create).not.toHaveBeenCalled();
      expect(prisma.owner.update).toHaveBeenCalled();
    });

    it('should replace name when new name is longer', async () => {
      const existingOwner = mockOwner({
        id: 2n, name: 'Short',
        numbers: [mockNumber({ number: '555-9999' })],
        ownerInfo: [],
      });
      prisma.number.findFirst.mockResolvedValue({
        number: '555-9999',
        ownerId: 2n,
        owner: existingOwner,
      } as any);
      prisma.owner.update.mockResolvedValue(
        mockOwner({
          id: 2n, name: 'Much Longer Name',
          numbers: [mockNumber({ number: '555-9999' })],
          ownerInfo: [],
        }),
      );

      const result = await service.create({
        name: 'Much Longer Name',
        project_id: 1,
        phones: [{ phone: '555-9999' }],
      });

      expect(result.name).toBe('Much Longer Name');
      expect(prisma.owner.update).toHaveBeenCalled();
    });

    it('should fill name when existing name is null', async () => {
      const existingOwner = mockOwner({
        id: 2n, name: null,
        numbers: [mockNumber({ number: '555-9999' })],
        ownerInfo: [],
      });
      prisma.number.findFirst.mockResolvedValue({
        number: '555-9999',
        ownerId: 2n,
        owner: existingOwner,
      } as any);
      prisma.owner.update.mockResolvedValue(
        mockOwner({
          id: 2n, name: 'New Name',
          numbers: [mockNumber({ number: '555-9999' })],
          ownerInfo: [],
        }),
      );

      const result = await service.create({
        name: 'New Name',
        project_id: 1,
        phones: [{ phone: '555-9999' }],
      });

      expect(result.name).toBe('New Name');
    });

    it('should add new numbers and info when merging', async () => {
      const existingOwner = mockOwner({
        id: 2n, name: 'Existing',
        numbers: [mockNumber({ number: '555-0001' })],
        ownerInfo: [mockOwnerInfo({ key: 'city', value: 'NYC' })],
      });
      prisma.number.findFirst.mockResolvedValue({
        number: '555-0001',
        ownerId: 2n,
        owner: existingOwner,
      } as any);
      prisma.owner.update.mockResolvedValue(
        mockOwner({
          id: 2n, name: 'Existing',
          numbers: [
            mockNumber({ number: '555-0001' }),
            mockNumber({ number: '555-0002' }),
          ],
          ownerInfo: [
            mockOwnerInfo({ key: 'city', value: 'NYC' }),
            mockOwnerInfo({ key: 'email', value: 'a@b.com' }),
          ],
        }),
      );

      const result = await service.create({
        name: 'Existing',
        project_id: 1,
        phones: [{ phone: '555-0001' }, { phone: '555-0002' }],
        info: [{ key: 'email', value: 'a@b.com' }],
      });

      expect(result.phones).toHaveLength(2);
      expect(result.info).toHaveLength(2);
    });
  });

  describe('createBulk', () => {
    it('should create multiple owners', async () => {
      prisma.number.findFirst.mockResolvedValue(null);
      prisma.owner.create
        .mockResolvedValueOnce(
          mockOwner({ id: 3n, name: 'Alice', numbers: [mockNumber({ number: '555-1111' })], ownerInfo: [] }),
        )
        .mockResolvedValueOnce(
          mockOwner({ id: 4n, name: 'Bob', numbers: [mockNumber({ number: '555-2222' })], ownerInfo: [] }),
        );

      const results = await service.createBulk([
        { name: 'Alice', phones: [{ phone: '555-1111' }], project_id: 1 },
        { name: 'Bob', phones: [{ phone: '555-2222' }], project_id: 1 },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Alice');
      expect(results[1].name).toBe('Bob');
    });

    it('should merge when duplicate number appears later in bulk', async () => {
      prisma.number.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          number: '555-1111',
          ownerId: 3n,
          owner: mockOwner({ id: 3n, name: 'Alice', numbers: [mockNumber({ number: '555-1111' })], ownerInfo: [] }),
        } as any);

      prisma.owner.create.mockResolvedValue(
        mockOwner({ id: 3n, name: 'Alice', numbers: [mockNumber({ number: '555-1111' })], ownerInfo: [] }),
      );
      prisma.owner.update.mockResolvedValue(
        mockOwner({
          id: 3n, name: 'Alice',
          numbers: [mockNumber({ number: '555-1111' }), mockNumber({ number: '555-3333' })],
          ownerInfo: [],
        }),
      );

      const results = await service.createBulk([
        { name: 'Alice', phones: [{ phone: '555-1111' }], project_id: 1 },
        { name: 'Alice Extended', phones: [{ phone: '555-1111' }, { phone: '555-3333' }], project_id: 1 },
      ]);

      expect(results).toHaveLength(2);
      expect(results[1].name).toBe('Alice');
      expect(results[1].phones).toHaveLength(2);
    });

    it('should rollback when an error occurs', async () => {
      prisma.number.findFirst.mockResolvedValue(null);
      prisma.owner.create
        .mockResolvedValueOnce(
          mockOwner({ id: 3n, name: 'Alice', numbers: [mockNumber({ number: '555-1111' })], ownerInfo: [] }),
        )
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.createBulk([
          { name: 'Alice', phones: [{ phone: '555-1111' }], project_id: 1 },
          { name: 'Bob', phones: [{ phone: '555-2222' }], project_id: 1 },
        ]),
      ).rejects.toThrow('DB error');
    });
  });

  describe('assignToProject', () => {
    it('should assign owner to a project', async () => {
      const owner = mockOwner({ name: 'John', numbers: [], ownerInfo: [] });
      prisma.owner.findUnique.mockResolvedValue(owner);
      prisma.project.findFirst.mockResolvedValue(mockProject({ name: 'Default Project' }));
      prisma.ownerProject.upsert.mockResolvedValue({ ownerId: 1n, projectId: 1 });

      const result = await service.assignToProject(1, 'Default Project');
      expect(result.name).toBe('John');
    });

    it('should throw NotFoundException when owner does not exist', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);

      await expect(service.assignToProject(999, 'Default Project')).rejects.toThrow('Owner not found');
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.owner.findUnique.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.assignToProject(1, 'NoProject')).rejects.toThrow('Project "NoProject" not found');
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

  describe('remove', () => {
    it('should delete an existing owner', async () => {
      prisma.owner.findUnique.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));
      prisma.owner.delete.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));

      await service.remove(1);
      expect(prisma.owner.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException for non-existent id', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow('Owner not found');
    });
  });

  describe('getStatusCounts', () => {
    it('should return distinct normalized statuses with counts', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { status: 'active', count: 5 },
        { status: 'inactive', count: 3 },
      ]);

      const result = await service.getStatusCounts();
      expect(result).toEqual([
        { status: 'active', count: 5 },
        { status: 'inactive', count: 3 },
      ]);
    });

    it('should return empty array when no owners exist', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
      const result = await service.getStatusCounts();
      expect(result).toEqual([]);
    });
  });

  describe('getNextOwner', () => {
    it('should return owner with lowest attempt_count', async () => {
      prisma.owner.findMany.mockResolvedValue([
        mockOwner({ name: 'John', numbers: [], ownerInfo: [] }),
      ]);

      const next = await service.getNextOwner({ projectId: 1 });
      expect(next).not.toBeNull();
      expect(next!.name).toBe('John');
    });

    it('should return null when no owner available', async () => {
      prisma.owner.findMany.mockResolvedValue([]);
      const next = await service.getNextOwner({ projectId: 1 });
      expect(next).toBeNull();
    });
  });
});
