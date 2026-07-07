import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockProject } from '../prisma/mock-data';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      prisma.project.findMany.mockResolvedValue([mockProject()]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Default Project');
    });
  });

  describe('findById', () => {
    it('should return project by id', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject({ name: 'Test', description: null }));
      const project = await service.findById(1);
      expect(project).not.toBeNull();
      expect(project!.name).toBe('Test');
    });

    it('should return null for non-existent id', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      expect(await service.findById(999)).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      prisma.project.create.mockResolvedValue(mockProject({ id: 2, name: 'New Project', description: 'Desc' }));
      const project = await service.create({ name: 'New Project', description: 'Desc' });
      expect(project.id).toBe(2);
      expect(project.name).toBe('New Project');
    });

    it('should create project without description', async () => {
      prisma.project.create.mockResolvedValue(mockProject({ id: 2, name: 'Minimal', description: null }));
      const project = await service.create({ name: 'Minimal' });
      expect(project.description).toBeNull();
    });

    it('should throw ConflictException for duplicate name', async () => {
      const prismaError = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
        'Unique constraint', { code: 'P2002', clientVersion: '7.8.0' },
      );
      prisma.project.create.mockRejectedValue(prismaError);
      await expect(service.create({ name: 'Duplicate' })).rejects.toThrow(
        'Project with this name already exists',
      );
    });
  });

  describe('update', () => {
    it('should update project fields', async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject({ id: 1, name: 'Old', description: null }));
      prisma.project.update.mockResolvedValue(mockProject({ id: 1, name: 'Updated Name', description: null }));
      const updated = await service.update(1, { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');
    });

    it('should throw NotFoundException for non-existent id', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.update(999, { name: 'Nope' })).rejects.toThrow('Project not found');
    });
  });

  describe('delete', () => {
    it('should delete existing project', async () => {
      prisma.project.delete.mockResolvedValue(mockProject());
      expect(await service.delete(1)).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      const prismaError = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
        'Not found', { code: 'P2025', clientVersion: '7.8.0' },
      );
      prisma.project.delete.mockRejectedValue(prismaError);
      expect(await service.delete(999)).toBe(false);
    });
  });
});
