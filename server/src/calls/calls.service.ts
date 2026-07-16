import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { SubmitCallDto } from '@/calls/dto/submit-call.dto';
import type { NotifyCallingDto } from '@/calls/dto/notify-calling.dto';
import type { CallResponseDto } from '@/calls/dto/call-response.dto';
import type { NextOwnerResponseDto } from '@/calls/dto/next-owner-response.dto';
import type { StatusCountDto } from '@/calls/dto/status-count.dto';
import { OwnersService } from '@/owners/owners.service';
import { DEFAULT_PAGE_LIMIT } from './config';

const callWithProjects = Prisma.validator<Prisma.CallDetailRecordDefaultArgs>()({
  include: {
    owner: {
      include: {
        ownerProjects: {
          include: { project: true },
        },
      },
    },
  },
});

type CallWithProjects = Prisma.CallDetailRecordGetPayload<typeof callWithProjects>;

@Injectable()
export class CallsService {
  constructor(
    private prisma: PrismaService,
    private ownersService: OwnersService,
  ) {}

  private toCallResponse(call: CallWithProjects): CallResponseDto {
    return {
      id: Number(call.id),
      owner_id: Number(call.ownerId),
      agent_id: call.agentId ?? 0,
      status: call.status ?? '',
      time: call.time.toISOString(),
      duration: call.duration,
      agent_notes: call.agentNotes,
      projects: call.owner?.ownerProjects.map(op => ({
        id: op.project.id,
        name: op.project.name,
      })) ?? [],
    };
  }

  async findAll(filters: {
    owner_id?: number;
    agent_id?: number;
    status?: string;
    page?: number;
    limit?: number;
    from?: Date;
    to?: Date;
    project_id?: number;
  }): Promise<{ data: CallResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const where: any = {};
    if (filters.owner_id !== undefined) where.ownerId = filters.owner_id;
    if (filters.agent_id !== undefined) where.agentId = filters.agent_id;
    if (filters.status) where.status = filters.status;
    if (filters.from) where.time = { ...where.time, gte: filters.from };
    if (filters.to) where.time = { ...where.time, lte: filters.to };
    if (filters.project_id !== undefined) {
      where.owner = { ownerProjects: { some: { projectId: filters.project_id } } };
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? DEFAULT_PAGE_LIMIT;
    const include = callWithProjects.include;

    const [calls, total] = await Promise.all([
      this.prisma.callDetailRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { time: 'desc' },
        include,
      }),
      this.prisma.callDetailRecord.count({ where }),
    ]);

    return {
      data: calls.map(c => this.toCallResponse(c)),
      meta: { total, page, limit },
    };
  }

  async findById(id: number): Promise<CallResponseDto | null> {
    const call = await this.prisma.callDetailRecord.findUnique({
      where: { id },
      include: callWithProjects.include,
    });
    if (!call) return null;
    return this.toCallResponse(call);
  }

  async submit(dto: SubmitCallDto, agentId: number): Promise<CallResponseDto> {
    const call = await this.prisma.callDetailRecord.create({
      data: {
        ownerId: dto.owner_id,
        agentId,
        status: dto.status,
        time: new Date(dto.time),
        duration: dto.duration ?? null,
        agentNotes: dto.agent_notes ?? null,
      },
    });

    if (call.ownerId && (['not_interested', 'contacted'].includes(call.status??""))) 
      await this.ownersService.update(Number(call.ownerId), { status: 'inactive' });

    return {
      id: Number(call.id),
      owner_id: Number(call.ownerId),
      agent_id: call.agentId ?? 0,
      status: call.status ?? '',
      time: call.time.toISOString(),
      duration: call.duration,
      agent_notes: call.agentNotes,
      projects: [],
    };
  }

  async getNextOwner(args?: { projectId?: number, date?: Date }): Promise<NextOwnerResponseDto | null> {
    const owner = await this.ownersService.getNextOwner(args);
    if (!owner) return null;

    const calls = await this.prisma.callDetailRecord.findMany({
      where: { ownerId: owner.id },
      orderBy: { time: 'desc' },
      include: callWithProjects.include,
    });

    return {
      owner,
      calls: calls.map(c => this.toCallResponse(c)),
    };
  }

  async getStatusCounts(from?: Date, to?: Date): Promise<StatusCountDto[]> {
    const timeFilter: any = {};
    if (from) timeFilter.gte = from;
    if (to) timeFilter.lte = to;

    const allStatuses = await this.prisma.callDetailRecord.findMany({
      where: { status: { not: null } },
      distinct: ['status'],
      select: { status: true },
    });

    const statusSet = new Set<string>();
    for (const r of allStatuses) {
      statusSet.add(r.status!.trim().toLowerCase());
    }

    const counts = await this.prisma.callDetailRecord.groupBy({
      by: ['status'],
      _count: true,
      where: {
        status: { not: null },
        ...(Object.keys(timeFilter).length ? { time: timeFilter } : {}),
      },
    });

    const countMap = new Map<string, number>();
    for (const c of counts) {
      const key = c.status!.trim().toLowerCase();
      countMap.set(key, (countMap.get(key) ?? 0) + c._count);
    }

    return [...statusSet].sort().map(status => ({ status, count: countMap.get(status) ?? 0 }));
  }

  async notifyCalling(dto: NotifyCallingDto): Promise<void> {
    const where:any = {};
    where.id = dto.owner_id;
    if (dto.owner_number) {
      where.ownerNumbers = { some: { number: dto.owner_number } };
    }

    await
    this.prisma.owner.update({
      where,
      data: { lastDialedAt: new Date().toISOString() },
    })
  }
}
