import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateOwnerDto } from './dto/create-owner.dto';
import type { UpdateOwnerDto } from './dto/update-owner.dto';
import type { OwnerResponseDto } from './dto/owner-response.dto';
import type { StatusCountDto } from '@/calls/dto/status-count.dto';
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
    phones: owner.numbers.map(n => ({ phone: n.number })),
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
    return this.upsertOwner(this.prisma, dto);
  }

  async createBulk(dtos: CreateOwnerDto[]): Promise<OwnerResponseDto[]> {
    return this.prisma.$transaction(async (tx) => {
      const results: OwnerResponseDto[] = [];
      for (const dto of dtos) {
        results.push(await this.upsertOwner(tx, dto));
      }
      return results;
    });
  }

  private async upsertOwner(client: any, dto: CreateOwnerDto): Promise<OwnerResponseDto> {
    const phoneNumbers = dto.phones.map(n => n.phone);
    const existingNumber = await client.number.findFirst({
      where: { number: { in: phoneNumbers } },
      include: { owner: { include: { numbers: true, ownerInfo: true } } },
    });

    if (existingNumber) {
      const owner = existingNumber.owner;
      const existingPhoneValues = owner.numbers.map((n: { number: string }) => n.number);
      const newNumbers = phoneNumbers.filter(n => !existingPhoneValues.includes(n));
      const existingInfoKeys = (owner.ownerInfo ?? []).map((i: { key: string }) => i.key);
      const newInfo = (dto.info ?? []).filter(
        i => i.key != null && i.value != null && !existingInfoKeys.includes(i.key!),
      );

      const mergedName =
        dto.name !== undefined
          ? !owner.name || dto.name.length > owner.name.length
            ? dto.name
            : undefined
          : undefined;

      const updated = await client.owner.update({
        where: { id: owner.id },
        data: {
          ...(mergedName !== undefined ? { name: mergedName } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(newNumbers.length > 0
            ? { numbers: { create: newNumbers.map(n => ({ number: n })) } }
            : {}),
          ...(newInfo.length > 0
            ? {
                ownerInfo: {
                  create: newInfo.map(i => ({ key: i.key!, value: i.value! })),
                },
              }
            : {}),
          ...(dto.project_id
            ? {
                ownerProjects: {
                  upsert: {
                    where: {
                      ownerId_projectId: {
                        ownerId: owner.id,
                        projectId: dto.project_id,
                      },
                    },
                    create: { projectId: dto.project_id },
                    update: {},
                  },
                },
              }
            : {}),
        },
        include: { numbers: true, ownerInfo: true },
      });

      return toOwnerResponse(updated);
    }

    const created = await client.owner.create({
      data: {
        name: dto.name,
        status: dto.status ?? 'active',
        attemptCount: 0,
        numbers: {
          create: dto.phones.map(n => ({ number: n.phone })),
        },
        ownerInfo: dto.info?.length
          ? {
              create: dto.info
                .filter(i => i.key != null && i.value != null)
                .map(i => ({ key: i.key!, value: i.value! })),
            }
          : undefined,
        ownerProjects: dto.project_id
          ? { create: { projectId: dto.project_id } }
          : undefined,
      },
      include: { numbers: true, ownerInfo: true },
    });

    return toOwnerResponse(created);
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
    const where: Prisma.OwnerWhereInput = { status: 'active' };
    if (projectId !== undefined) {
      where.ownerProjects = { some: { projectId } };
    }
    const owners = await this.prisma.owner.findMany({
      where,
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

  async getStatusCounts(): Promise<StatusCountDto[]> {
    return this.prisma.$queryRaw<StatusCountDto[]>`
      SELECT LOWER(TRIM(status)) as status, COUNT(*)::int as count
      FROM owner
      WHERE status IS NOT NULL
      GROUP BY LOWER(TRIM(status))
      ORDER BY status
    `;
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
