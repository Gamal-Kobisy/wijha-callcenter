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
  async getHealth(): Promise<{ status: string; db_status: any }> {
    const dbConnectionStatus: any[] = await this.prisma.$queryRaw`SELECT VERSION()`;
    return { status: 'OK', db_status: dbConnectionStatus[0].version.split(' ')[0] };
  }
}
