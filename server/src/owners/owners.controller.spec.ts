import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { OwnersController } from './owners.controller';
import { OwnersService } from './owners.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockOwner, mockNumber, mockOwnerInfo, mockProject } from '../prisma/mock-data';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('OwnersController', () => {
  let controller: OwnersController;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    prisma.owner.findMany.mockResolvedValue([
      mockOwner({
        name: 'John Doe',
        numbers: [mockNumber({ number: '555-0100' })],
        ownerInfo: [mockOwnerInfo({ key: 'email', value: 'john@example.com' })],
      }),
      mockOwner({ id: 2n, name: 'Jane Smith', numbers: [], ownerInfo: [] }),
    ]);
    prisma.owner.count.mockResolvedValue(2);
    prisma.owner.create.mockResolvedValue(
      mockOwner({ id: 3n, name: 'New Owner', status: 'pending', numbers: [mockNumber({ number: '555-9999' })], ownerInfo: [mockOwnerInfo()] }),
    );
    prisma.owner.findUnique.mockResolvedValue(
      mockOwner({
        numbers: [mockNumber({ number: '555-0100' })],
        ownerInfo: [mockOwnerInfo({ key: 'email', value: 'john@example.com' })],
      }),
    );
    prisma.owner.update.mockResolvedValue(
      mockOwner({ status: 'completed', numbers: [], ownerInfo: [] }),
    );
    prisma.owner.findFirst.mockResolvedValue(
      mockOwner({
        numbers: [mockNumber({ number: '555-0100' })],
        ownerInfo: [mockOwnerInfo({ key: 'email', value: 'john@example.com' })],
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnersController],
      providers: [
        OwnersService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OwnersController>(OwnersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /owners', () => {
    it('should return paginated owners', async () => {
      const result = await controller.findAll({});
      expect(result.data).toHaveLength(2);
      expect(result.meta).toHaveProperty('total');
    });

    it('should filter by status', async () => {
      const result = await controller.findAll({ status: 'active' });
      expect(result.data).toHaveLength(2);
    });

    it('should respect pagination params', async () => {
      prisma.owner.findMany.mockResolvedValue([
        mockOwner({ numbers: [], ownerInfo: [] }),
      ]);
      prisma.owner.count.mockResolvedValue(1);
      const result = await controller.findAll({ limit: '1', page: '1' });
      expect(result.data).toHaveLength(1);
      expect(result.meta.limit).toBe(1);
    });
  });

  describe('POST /owners', () => {
    it('should create an owner with nested data', async () => {
      const result = await controller.create({
        name: 'New Owner',
        project_id: 1,
        numbers: [{ number: '555-9999' }],
        info: [{ key: 'city', value: 'NYC' }],
      });

      expect(result.name).toBe('New Owner');
      expect(result.numbers).toHaveLength(1);
      expect(result.info).toHaveLength(1);
    });
  });

  describe('GET /owners/:ownerId', () => {
    it('should return owner by id', async () => {
      const result = await controller.findOne(1);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('John Doe');
    });

    it('should return null for non-existent', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      const result = await controller.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('PATCH /owners/:ownerId', () => {
    it('should update owner', async () => {
      const result = await controller.patch(1, { status: 'completed' });
      expect(result.status).toBe('completed');
    });
  });

  describe('POST /owners/:ownerId/projects', () => {
    it('should assign owner to a project', async () => {
      prisma.owner.findUnique.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));
      prisma.project.findFirst.mockResolvedValue(mockProject({ name: 'Default Project' }));
      prisma.ownerProject.upsert.mockResolvedValue({ ownerId: 1n, projectId: 1 });

      const result = await controller.assignProject(1, { project_name: 'Default Project' });
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('John');
    });
  });

  describe('DELETE /owners/:ownerId', () => {
    it('should delete an owner', async () => {
      prisma.owner.findUnique.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));
      prisma.owner.delete.mockResolvedValue(mockOwner({ name: 'John', numbers: [], ownerInfo: [] }));

      await expect(controller.remove(1)).resolves.toBeUndefined();
      expect(prisma.owner.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
