import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateOwnerDto } from './dto/create-owner.dto';
import type { UpdateOwnerDto } from './dto/update-owner.dto';
import type { OwnerResponseDto } from './dto/owner-response.dto';
import type { StatusCountDto } from '@/calls/dto/status-count.dto';

type ClientWithRelations = {
  id: bigint;
  name?: string | null;
  type?: string | null;
  nextDialAt?: Date | null;
  numbers: { number: string }[];
  clientInfo?: { key: string; value: string }[];
  clientProjects?: { projectId: number; status: string | null; attemptCount: number | null; lastDialedAt: Date | null; project: { id: number; name: string } }[];
};

function toOwnerResponse(client: ClientWithRelations): OwnerResponseDto {
  return {
    id: Number(client.id),
    name: client.name ?? undefined,
    type: client.type ?? undefined,
    next_dial_at: client.nextDialAt?.toISOString() ?? null,
    phones: client.numbers.map(n => ({ phone: n.number })),
    info: client.clientInfo?.map(i => ({ key: i.key, value: i.value })),
    projects: client.clientProjects?.map(cp => ({
      project_id: cp.projectId,
      project_name: cp.project.name,
      status: cp.status ?? undefined,
      attempt_count: cp.attemptCount ?? 0,
      last_dialed_at: cp.lastDialedAt?.toISOString() ?? null,
    })),
  };
}

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    project_id?: number,
    type?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: OwnerResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const where: any = {};
    if (type) where.type = type;
    if (project_id) where.clientProjects = { some: { projectId: project_id } };

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { numbers: true, clientInfo: true, clientProjects: { include: { project: true } } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data: clients.map(toOwnerResponse),
      meta: { total, page, limit },
    };
  }

  async findById(id: number): Promise<OwnerResponseDto | null> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { numbers: true, clientInfo: true, clientProjects: { include: { project: true } } },
    });
    if (!client) return null;
    return toOwnerResponse(client);
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
      include: { client: { include: { numbers: true, clientInfo: true } } },
    });

    if (existingNumber) {
      const existingClient = existingNumber.client;
      const existingPhoneValues = existingClient.numbers.map((n: { number: string }) => n.number);
      const newNumbers = phoneNumbers.filter(n => !existingPhoneValues.includes(n));
      const existingInfoKeys = (existingClient.clientInfo ?? []).map((i: { key: string }) => i.key);
      const newInfo = (dto.info ?? []).filter(
        i => i.key != null && i.value != null && !existingInfoKeys.includes(i.key!),
      );

      const mergedName =
        dto.name !== undefined
          ? !existingClient.name || dto.name.length > existingClient.name.length
            ? dto.name
            : undefined
          : undefined;

      const updated = await client.client.update({
        where: { id: existingClient.id },
        data: {
          ...(mergedName !== undefined ? { name: mergedName } : {}),
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(newNumbers.length > 0
            ? { numbers: { create: newNumbers.map(n => ({ number: n })) } }
            : {}),
          ...(newInfo.length > 0
            ? {
                clientInfo: {
                  create: newInfo.map(i => ({ key: i.key!, value: i.value! })),
                },
              }
            : {}),
          ...(dto.project_id
            ? {
                clientProjects: {
                  upsert: {
                    where: {
                      clientId_projectId: {
                        clientId: existingClient.id,
                        projectId: dto.project_id,
                      },
                    },
                    create: { projectId: dto.project_id, status: 'dial', attemptCount: 0 },
                    update: {},
                  },
                },
              }
            : {}),
        },
        include: { numbers: true, clientInfo: true },
      });

      return toOwnerResponse(updated);
    }

    const created = await client.client.create({
      data: {
        name: dto.name,
        type: dto.type ?? 'OWNER',
        numbers: {
          create: dto.phones.map(n => ({ number: n.phone })),
        },
        clientInfo: dto.info?.length
          ? {
              create: dto.info
                .filter(i => i.key != null && i.value != null)
                .map(i => ({ key: i.key!, value: i.value! })),
            }
          : undefined,
        clientProjects: dto.project_id
          ? { create: { projectId: dto.project_id, status: 'dial', attemptCount: 0 } }
          : undefined,
      },
      include: { numbers: true, clientInfo: true },
    });

    return toOwnerResponse(created);
  }

  async update(id: number, dto: UpdateOwnerDto): Promise<OwnerResponseDto> {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.next_dial_at !== undefined ? { nextDialAt: dto.next_dial_at ? new Date(dto.next_dial_at).toISOString() : null } : {}),
      },
      include: { numbers: true, clientInfo: true },
    });

    return toOwnerResponse(client);
  }

  async getNextOwner(args: { projectId: number, date?: Date }): Promise<OwnerResponseDto | null> {
    const { projectId } = args;

    const rows = await this.prisma.$queryRaw<{ id: bigint }[]>`
      SELECT c.id
      FROM client c
      JOIN client_project cp ON cp.client_id = c.id
      WHERE cp.project_id = ${projectId}
        AND cp.status IN ('dial', 'callback', 'not_answered')
        AND (c.next_dial_at IS NULL OR c.next_dial_at <= NOW())
      ORDER BY c.next_dial_at ASC NULLS FIRST
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    const client = await this.prisma.client.findUnique({
      where: { id: rows[0].id },
      include: { numbers: true, clientInfo: true },
    });

    if (!client) return null;
    return toOwnerResponse(client);
  }

  async getStatusCounts(): Promise<StatusCountDto[]> {
    return this.prisma.$queryRaw<StatusCountDto[]>`
      SELECT LOWER(TRIM(status)) as status, COUNT(*)::int as count
      FROM client_project
      WHERE status IS NOT NULL
      GROUP BY LOWER(TRIM(status))
      ORDER BY status
    `;
  }

  async assignToProject(clientId: number, projectName: string): Promise<OwnerResponseDto> {
    const existingClient = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!existingClient) throw new NotFoundException('Client not found');

    const project = await this.prisma.project.findFirst({ where: { name: projectName } });
    if (!project) throw new NotFoundException(`Project "${projectName}" not found`);

    await this.prisma.clientProject.upsert({
      where: { clientId_projectId: { clientId, projectId: project.id } },
      create: { clientId, projectId: project.id, status: 'dial', attemptCount: 0 },
      update: {},
    });

    const updated = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { numbers: true, clientInfo: true },
    });
    return toOwnerResponse(updated!);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.client.delete({ where: { id } });
  }
}
