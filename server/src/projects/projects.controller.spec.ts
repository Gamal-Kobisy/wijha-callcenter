import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockProject } from '../prisma/mock-data';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    prisma.project.findMany.mockResolvedValue([mockProject()]);
    prisma.project.findUnique.mockResolvedValue(mockProject());
    prisma.project.create.mockResolvedValue(mockProject({ id: 2, name: 'New Project', description: 'Desc' }));
    prisma.project.update.mockResolvedValue(mockProject({ id: 1, name: 'Updated' }));
    prisma.project.delete.mockResolvedValue(mockProject());

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /projects', () => {
    it('should return all projects', async () => {
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Default Project');
    });
  });

  describe('POST /projects', () => {
    it('should create a project', async () => {
      const result = await controller.create({ name: 'New Project', description: 'Desc' });
      expect(result.id).toBe(2);
      expect(result.name).toBe('New Project');
    });
  });

  describe('GET /projects/:projectId', () => {
    it('should return project by id', async () => {
      const result = await controller.findOne(1);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Default Project');
    });

    it('should return null for non-existent', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      const result = await controller.findOne(999);
      expect(result).toBeNull();
    });
  });

  describe('PATCH /projects/:projectId', () => {
    it('should update project', async () => {
      const result = await controller.update(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('DELETE /projects/:projectId', () => {
    it('should delete project', async () => {
      await expect(controller.remove(1)).resolves.toBeUndefined();
    });
  });
});
