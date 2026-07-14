import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateSessionDto } from './dto/create-session.dto';
import type { SessionResponseDto } from './dto/session-response.dto';
import type { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: {
      from?: string;
      to?: string;
      user_id?: string;
      time?: string;
    },
    user: AuthenticatedUser,
  ): Promise<SessionResponseDto[]> {
    const where: any = {};

    if (user.role === 'user') {
      where.agentId = user.id;
    } else if (query.user_id) {
      where.agentId = Number(query.user_id);
    }

    const firstBeatFilter: any = {};
    if (query.from) firstBeatFilter.gte = new Date(query.from);
    if (query.to) firstBeatFilter.lte = new Date(query.to);

    if (query.time) {
      const t = new Date(query.time);
      firstBeatFilter.lte = t;
      where.lastBeat = { gte: t };
    }

    if (Object.keys(firstBeatFilter).length > 0) {
      where.firstBeat = firstBeatFilter;
    }

    const sessions = await this.prisma.userSession.findMany({
      where,
      orderBy: { firstBeat: 'desc' },
    });

    return sessions.map(s => ({
      agent_id: s.agentId,
      first_beat: s.firstBeat.toISOString(),
      last_beat: s.lastBeat.toISOString(),
    }));
  }

  async create(dto: CreateSessionDto, agentId: number): Promise<SessionResponseDto> {
    const first = new Date(dto.first_beat);
    const last = new Date(dto.last_beat);

    return this.prisma.$transaction(async (tx) => {
      const overlapping = await tx.userSession.findMany({
        where: {
          agentId,
          firstBeat: { lte: last },
          lastBeat: { gte: first },
        },
        orderBy: { firstBeat: 'asc' },
      });

      if (overlapping.length > 0) {
        const mergedFirst = overlapping.reduce(
          (min, s) => s.firstBeat < min ? s.firstBeat : min,
          first,
        );
        const mergedLast = overlapping.reduce(
          (max, s) => s.lastBeat > max ? s.lastBeat : max,
          last,
        );

        await tx.userSession.deleteMany({
          where: {
            agentId,
            firstBeat: { in: overlapping.map(s => s.firstBeat) },
          },
        });

        await tx.userSession.create({
          data: { agentId, firstBeat: mergedFirst, lastBeat: mergedLast },
        });

        return {
          agent_id: agentId,
          first_beat: mergedFirst.toISOString(),
          last_beat: mergedLast.toISOString(),
        };
      }

      await tx.userSession.create({
        data: { agentId, firstBeat: first, lastBeat: last },
      });

      return {
        agent_id: agentId,
        first_beat: first.toISOString(),
        last_beat: last.toISOString(),
      };
    });
  }

  async beat(agentId: number): Promise<SessionResponseDto> {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existing = await this.prisma.userSession.findFirst({
      where: {
        agentId,
        lastBeat: { gte: fiveMinAgo },
      },
      orderBy: { lastBeat: 'desc' },
    });

    if (existing) {
      const now = new Date();
      const updated = await this.prisma.userSession.update({
        where: {
          agentId_firstBeat: { agentId, firstBeat: existing.firstBeat },
        },
        data: { lastBeat: now },
      });

      return {
        agent_id: updated.agentId,
        first_beat: updated.firstBeat.toISOString(),
        last_beat: updated.lastBeat.toISOString(),
      };
    }

    const now = new Date();
    const created = await this.prisma.userSession.create({
      data: { agentId, firstBeat: now, lastBeat: now },
    });

    return {
      agent_id: created.agentId,
      first_beat: created.firstBeat.toISOString(),
      last_beat: created.lastBeat.toISOString(),
    };
  }
}
