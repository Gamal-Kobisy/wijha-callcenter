import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  getRoot(): { message: string } {
    return { message: 'Welcome to the API!' };
  }

  @Get('health')
  async getHealth(): Promise<{ status: string; db_connection: string }> {
    const dbConnectionStatus = await this.prisma.$queryRaw`SELECT 1` ? 'Connected' : 'Disconnected';
    return { status: 'OK', db_connection: dbConnectionStatus };
  }
}
