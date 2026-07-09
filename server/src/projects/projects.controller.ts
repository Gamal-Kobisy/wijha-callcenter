import { Controller, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type { ProjectResponseDto } from './dto/project-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll();
  }

  @Get(':projectId')
  async findOne(@Param('projectId', ParseIntPipe) projectId: number): Promise<ProjectResponseDto | null> {
    return this.projectsService.findById(projectId);
  }
}
