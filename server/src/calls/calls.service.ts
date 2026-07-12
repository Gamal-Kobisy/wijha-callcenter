import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SubmitCallDto } from './dto/submit-call.dto';
import type { NotifyCallingDto } from './dto/notify-calling.dto';
import type { CallResponseDto } from './dto/call-response.dto';
import type { NextOwnerResponseDto } from './dto/next-owner-response.dto';
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
    from?: Date;
    to?: Date;
  }): Promise<{ data: CallResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const where: any = {};
    if (filters.owner_id !== undefined) where.ownerId = filters.owner_id;
    if (filters.agent_id !== undefined) where.agentId = filters.agent_id;
    if (filters.status) where.status = filters.status;
    if (filters.from) where.time = { ...where.time, gte: filters.from };
    if (filters.to) where.time = { ...where.time, lte: filters.to };

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
    };
  }

  async getNextOwner(args?: { projectId?: number, date?: Date }): Promise<NextOwnerResponseDto | null> {
    const owner = await this.ownersService.getNextOwner(args);
    if (!owner) return null;

    const calls = await this.prisma.callDetailRecord.findMany({
      where: { ownerId: owner.id },
      orderBy: { time: 'desc' },
    });

    return {
      owner,
      calls: calls.map(c => ({
        id: Number(c.id),
        owner_id: Number(c.ownerId),
        agent_id: c.agentId ?? 0,
        status: c.status ?? '',
        time: c.time.toISOString(),
        duration: c.duration,
        agent_notes: c.agentNotes,
      })),
    };
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
