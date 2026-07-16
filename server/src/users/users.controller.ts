import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import type { UserStatsDto } from './dto/user-stats.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(@Query() query: ListUsersQueryDto): Promise<UserResponseDto[]> {
    return this.usersService.findAll(query.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(@Body() dto: BulkCreateUsersDto): Promise<UserResponseDto[]> {
    return this.usersService.createBulk(dto.users);
  }

  @Get(':userId')
  async findOne(@Param('userId', ParseIntPipe) userId: number): Promise<UserResponseDto | null> {
    return this.usersService.findById(userId);
  }

  @Patch(':userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(userId, dto);
  }

  @Delete(':userId/deactivate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('userId', ParseIntPipe) userId: number): Promise<UserResponseDto> {
    return this.usersService.deactivate(userId);
  }

  @Get(':userId/stats')
  async getStats(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<UserStatsDto | null> {
    return this.usersService.getStats(userId, from, to);
  }
}
