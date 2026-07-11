import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateOwnerDto } from './dto/create-owner.dto';
import type { UpdateOwnerDto } from './dto/update-owner.dto';
import type { OwnerResponseDto, OwnerNumberResponse, OwnerInfoResponse } from './dto/owner-response.dto';
import { isSameDay } from 'date-fns';

type OwnerWithRelations = {
  id: bigint;
  name?: string | null;
  status?: string | null;
  attemptCount?: number | null;
  lastDialedAt?: Date | null;
  nextDialAt?: Date | null;
  numbers: { number: string }[];
  ownerInfo?: { key: string; value: string }[];
};

function toOwnerResponse(owner: OwnerWithRelations): OwnerResponseDto {
  return {
    id: Number(owner.id),
    name: owner.name ?? undefined,
    status: owner.status ?? 'active',
    attempt_count: owner.attemptCount ?? 0,
    last_dialed_at: owner.lastDialedAt?.toISOString() ?? null,
    next_dial_at: owner.nextDialAt?.toISOString() ?? null,
    numbers: owner.numbers.map(n => ({ number: n.number })),
    info: owner.ownerInfo?.map(i => ({ key: i.key, value: i.value })),
  };
}

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    project_id?: number,
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: OwnerResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const where: any = {};
    if (status) where.status = status;
    if (project_id) where.ownerProjects = { some: { projectId: project_id } };

    const [owners, total] = await Promise.all([
      this.prisma.owner.findMany({
        where,
        include: { numbers: true, ownerInfo: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.owner.count({ where }),
    ]);

    return {
      data: owners.map(toOwnerResponse),
      meta: { total, page, limit },
    };
  }

  async findById(id: number): Promise<OwnerResponseDto | null> {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      include: { numbers: true, ownerInfo: true },
    });
    if (!owner) return null;
    return toOwnerResponse(owner);
  }

  async create(dto: CreateOwnerDto): Promise<OwnerResponseDto> {
    const numbers = dto.numbers.map(n => n.number);
    const existingNumber = await this.prisma.number.findFirst({
      where: { number: { in: numbers } },
      include: { owner: { include: { numbers: true, ownerInfo: true } } },
    });
    if (existingNumber) {
      return toOwnerResponse(existingNumber.owner);
    }

    const owner = await this.prisma.owner.create({
      data: {
        name: dto.name,
        status: dto.status ?? 'active',
        attemptCount: 0,
        numbers: {
          create: dto.numbers.map(n => ({ number: n.number })),
        },
        ownerInfo: dto.info?.length
          ? { create: dto.info.filter(i => i.key != null && i.value != null).map(i => ({ key: i.key!, value: i.value! })) }
          : undefined,
        ownerProjects: dto.project_id ? { create: { projectId: dto.project_id } } : undefined,
      },
      include: { numbers: true, ownerInfo: true },
    });

    return toOwnerResponse(owner);
  }

  async update(id: number, dto: UpdateOwnerDto): Promise<OwnerResponseDto> {
    const existing = await this.prisma.owner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Owner not found');
    }

    const owner = await this.prisma.owner.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.next_dial_at !== undefined ? { nextDialAt: dto.next_dial_at ? new Date(dto.next_dial_at).toISOString() : null } : {}),
      },
      include: { numbers: true, ownerInfo: true },
    });

    return toOwnerResponse(owner);
  }

  async getNextOwner(args?: { projectId?: number, date?: Date}): Promise<OwnerResponseDto | null> {
    const { projectId } = args || {};
    const owners = await this.prisma.owner.findMany({
      where: {
        status: 'active',
        ownerProjects: { some: { projectId } },
      },
      orderBy: {
        attemptCount: 'asc',
        lastDialedAt: 'asc',
      },
      include: { numbers: true, ownerInfo: true },
    });

    const today = new Date();
    const todays_owner = owners.filter(o => o.nextDialAt && isSameDay(o.nextDialAt, today));
    const owner = todays_owner.length > 0 ? todays_owner[0] : owners[0];

    if (!owner) return null;

    return toOwnerResponse(owner);
  }

  async assignToProject(ownerId: number, projectName: string): Promise<OwnerResponseDto> {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException('Owner not found');

    const project = await this.prisma.project.findFirst({ where: { name: projectName } });
    if (!project) throw new NotFoundException(`Project "${projectName}" not found`);

    await this.prisma.ownerProject.upsert({
      where: { ownerId_projectId: { ownerId, projectId: project.id } },
      create: { ownerId, projectId: project.id },
      update: {},
    });

    const updated = await this.prisma.owner.findUnique({
      where: { id: ownerId },
      include: { numbers: true, ownerInfo: true },
    });
    return toOwnerResponse(updated!);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.owner.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Owner not found');
    }

    await this.prisma.owner.delete({ where: { id } });
  }
}
