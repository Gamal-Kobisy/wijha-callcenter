<<<<<<< Updated upstream
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
=======
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
>>>>>>> Stashed changes
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { ProjectResponseDto } from './dto/project-response.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.create(dto);
  }

  @Get(':projectId')
  async findOne(@Param('projectId', ParseIntPipe) projectId: number): Promise<ProjectResponseDto | null> {
    return this.projectsService.findById(projectId);
  }

<<<<<<< Updated upstream
  @Patch(':projectId')
  async update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(projectId, dto);
  }

  @Delete(':projectId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('projectId', ParseIntPipe) projectId: number): Promise<void> {
    return this.projectsService.remove(projectId);
  }
}
=======
  @Post()
  async create(@Body() body: { name: string; description?: string }) {
    return this.projectsService.createProject(body.name, body.description);
  }

  @Put(':projectId')
  async update(@Param('projectId', ParseIntPipe) projectId: number, @Body() body: { name?: string; description?: string }) {
    return this.projectsService.updateProject(projectId, body);
  }

  @Delete(':projectId')
  async remove(@Param('projectId', ParseIntPipe) projectId: number): Promise<void> {
    return this.projectsService.deleteProject(projectId);
  }
}
>>>>>>> Stashed changes
