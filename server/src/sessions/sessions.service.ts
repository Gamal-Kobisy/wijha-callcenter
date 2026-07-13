import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateSessionDto } from './dto/create-session.dto';
import type { SessionResponseDto } from './dto/session-response.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(_from?: string, _to?: string): Promise<SessionResponseDto[]> {
    const where: any = {};
    if (_from || _to) {
      where.startTime = {};
      if (_from) where.startTime.gte = new Date(_from);
      if (_to) where.startTime.lte = new Date(_to);
    }

    const sessions = await this.prisma.userLog.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });

    return sessions.map(s => ({
      id: Number(s.id),
      agent_id: s.agentId ?? 0,
      start_time: s.startTime.toISOString(),
      duration: s.duration,
      is_active: s.isActive ?? false,
    }));
  }

  async create(dto: CreateSessionDto, agentId: number): Promise<SessionResponseDto> {
    const session = await this.prisma.userLog.create({
      data: {
        agentId,
        startTime: new Date(dto.start_time),
        duration: dto.duration ?? null,
        isActive: true,
      },
    });

    return {
      id: Number(session.id),
      agent_id: session.agentId ?? 0,
      start_time: session.startTime.toISOString(),
      duration: session.duration,
      is_active: session.isActive ?? false,
    };
  }

  async getActiveSession(): Promise<SessionResponseDto | null> {
    const session = await this.prisma.userLog.findFirst({
      where: { isActive: true },
    });
    if (!session) return null;

    return {
      id: Number(session.id),
      agent_id: session.agentId ?? 0,
      start_time: session.startTime.toISOString(),
      duration: session.duration,
      is_active: session.isActive ?? false,
    };
  }
}
