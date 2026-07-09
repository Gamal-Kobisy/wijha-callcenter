import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SubmitCallDto } from './dto/submit-call.dto';
import type { NotifyCallingDto } from './dto/notify-calling.dto';
import type { CallResponseDto } from './dto/call-response.dto';
import { OwnersService } from '../owners/owners.service';

@Injectable()
export class CallsService {
  constructor(
    private prisma: PrismaService,
    private ownersService: OwnersService,
  ) {}

  async findAll(filters: {
    owner_id?: number;
    agent_id?: number;
    status?: string;
    limit?: number;
  }): Promise<{ data: CallResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const where: any = {};
    if (filters.owner_id !== undefined) where.ownerId = filters.owner_id;
    if (filters.agent_id !== undefined) where.agentId = filters.agent_id;
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 50;

    const [calls, total] = await Promise.all([
      this.prisma.callDetailRecord.findMany({
        where,
        take: limit,
        orderBy: { time: 'desc' },
      }),
      this.prisma.callDetailRecord.count({ where }),
    ]);

    return {
      data: calls.map(c => ({
        id: Number(c.id),
        owner_id: Number(c.ownerId),
        agent_id: c.agentId ?? 0,
        status: c.status ?? '',
        time: c.time.toISOString(),
        duration: c.duration,
        agent_notes: c.agentNotes,
      })),
      meta: { total, page: 1, limit },
    };
  }

  async findById(id: number): Promise<CallResponseDto | null> {
    const call = await this.prisma.callDetailRecord.findUnique({ where: { id } });
    if (!call) return null;
    return {
      id: Number(call.id),
      owner_id: Number(call.ownerId),
      agent_id: call.agentId ?? 0,
      status: call.status ?? '',
      time: call.time.toISOString(),
      duration: call.duration,
      agent_notes: call.agentNotes,
    };
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

    return {
      id: Number(call.id),
      owner_id: Number(call.ownerId),
      agent_id: call.agentId ?? 0,
      status: call.status ?? '',
      time: call.time.toISOString(),
      duration: call.duration,
      agent_notes: call.agentNotes,
    };
  }

  async getNextOwner(projectId: number): Promise<CallResponseDto | null> {
    const owner = await this.ownersService.getNextOwner(projectId);
    if (!owner) return null;

    return {
      id: 0,
      owner_id: owner.id,
      agent_id: 0,
      status: 'pending',
      time: new Date().toISOString(),
      duration: null,
      agent_notes: null,
    };
  }

  async notifyCalling(_dto: NotifyCallingDto): Promise<void> {
    // In-memory: no-op
  }
}
