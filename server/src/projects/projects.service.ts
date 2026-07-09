import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
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

  async create(dto: CreateProjectDto): Promise<ProjectResponseDto> {
    try {
      return await this.prisma.project.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Project with this name already exists');
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    try {
      return await this.prisma.project.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Project with this name already exists');
      }
      throw err;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.project.delete({ where: { id } });
      return true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return false;
      }
      throw err;
    }
  }
}
