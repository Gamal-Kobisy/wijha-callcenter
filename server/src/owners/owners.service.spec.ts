import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { OwnersService } from './owners.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockOwner, mockNumber, mockOwnerInfo, mockProject } from '../prisma/mock-data';

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

    it('should return existing owner when number already exists', async () => {
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

      const result = await service.create({
        name: 'New Guy',
        project_id: 1,
        phones: [{ phone: '555-9999' }],
      });

      expect(result.name).toBe('Existing Jane');
      expect(prisma.owner.create).not.toHaveBeenCalled();
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
