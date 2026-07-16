import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserResponseDto } from './dto/user-response.dto';
import type { UserStatsDto } from './dto/user-stats.dto';
import { CallsService } from '@/calls/calls.service';
import { SessionsService } from '@/sessions/sessions.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private sessionService: SessionsService) {}

  async findAll(role?: string): Promise<UserResponseDto[]> {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      omit: { passwordHash: true },
    }) as unknown as UserResponseDto[];
  }

  async findById(id: number): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });
    return user as unknown as UserResponseDto | null;
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          phoneNumber: dto.phone ?? '',
          name: dto.name ?? null,
          role: dto.role,
        },
        omit: { passwordHash: true },
      });
      return user as unknown as UserResponseDto;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    try {
      const passwordHash = dto.password
        ? await bcrypt.hash(dto.password, 10)
        : undefined;

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.phone !== undefined ? { phoneNumber: dto.phone } : {}),
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(passwordHash !== undefined ? { passwordHash } : {}),
        },
        omit: { passwordHash: true },
      });
      return user as unknown as UserResponseDto;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  async deactivate(id: number): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: 'deleted', passwordHash: '!deleted!' },
      omit: { passwordHash: true },
    });
    return user as unknown as UserResponseDto;
  }

  async createBulk(dtos: CreateUserDto[]): Promise<UserResponseDto[]> {
    const emails = dtos.map(d => d.email);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      });

      if (existing.length > 0) {
        throw new ConflictException(
          `Duplicate emails: ${existing.map(e => e.email).join(', ')}`,
        );
      }

      const users: UserResponseDto[] = [];
      for (const dto of dtos) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            phoneNumber: dto.phone ?? '',
            name: dto.name ?? null,
            role: dto.role,
          },
          omit: { passwordHash: true },
        });
        users.push(user as unknown as UserResponseDto);
      }

      return users;
    });
  }

  async getStats(userId: number, _from?: string, _to?: string): Promise<UserStatsDto | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const where: any = { agentId: userId };
    if (_from || _to) {
      where.time = {};
      if (_from) where.time.gte = new Date(_from);
      if (_to) where.time.lte = new Date(_to);
    }

    const calls = await this.prisma.callDetailRecord.findMany({ where });

    const total_calls = calls.length;
    const answered = calls.filter(c => c.status === 'completed').length;
    const no_answer = calls.filter(c => c.status === 'no_answer').length;
    const busy = calls.filter(c => c.status === 'busy').length;
    const failed = calls.filter(c => c.status === 'failed').length;
    const callback = calls.filter(c => c.status === 'callback').length;
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration ?? 0), 0);
    const avg_duration_seconds = total_calls > 0 ? Math.round(totalDuration / total_calls) : 0;

    const sessions = await this.sessionService.findAll(
      { user_id: String(userId), from: _from, to: _to },
      { id: userId, email: user.email, role: user.role },
    );
    const total_session_time_seconds = sessions.reduce((sum, s) => sum + (new Date(s.last_beat).getTime() - new Date(s.first_beat).getTime())/1000, 0);

    return {
      total_calls,
      answered,
      no_answer,
      busy,
      failed,
      callback,
      avg_duration_seconds,
      total_session_time_seconds,
    };
  }
}
