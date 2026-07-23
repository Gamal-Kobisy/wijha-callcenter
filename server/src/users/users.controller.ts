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
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { profileImageOptions } from '@/common/multer.config';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(@Query() query: ListUsersQueryDto): Promise<UserResponseDto[]> {
    return this.usersService.findAll(query.role, query.online);
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

  @Patch(':userId/deactivate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('userId', ParseIntPipe) userId: number): Promise<UserResponseDto> {
    return this.usersService.deactivate(userId);
  }

  @Post(':userId/profile-image')
  @UseInterceptors(FileInterceptor('profile_image', profileImageOptions))
  @HttpCode(HttpStatus.OK)
  async uploadProfileImage(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      throw new ForbiddenException('You can only update your own profile image');
    }
    return this.usersService.uploadProfileImage(userId, file);
  }

  @Delete(':userId/profile-image')
  @HttpCode(HttpStatus.OK)
  async deleteProfileImage(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      throw new ForbiddenException('You can only delete your own profile image');
    }
    return this.usersService.deleteProfileImage(userId);
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
