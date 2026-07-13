import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ProjectsService } from './projects.service';
import { PrismaService } from '@/prisma/prisma.service';
import { mockProject } from '@/prisma/mock-data';

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
});
