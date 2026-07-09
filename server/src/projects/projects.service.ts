import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<ProjectResponseDto[]> {
    return this.prisma.project.findMany();
  }

  async findById(id: number): Promise<ProjectResponseDto | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }
}
