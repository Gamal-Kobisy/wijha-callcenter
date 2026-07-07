import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { SubmitCallDto } from './dto/submit-call.dto';
import { NotifyCallingDto } from './dto/notify-calling.dto';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';
import { GetNextOwnerQueryDto } from './dto/get-next-owner-query.dto';
import type { CallResponseDto } from './dto/call-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Get()
  async findAll(@Query() query: ListCallsQueryDto): Promise<{
    data: CallResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const ownerId = query.owner_id ? Number(query.owner_id) : undefined;
    const agentId = query.agent_id ? Number(query.agent_id) : undefined;
    const limit = query.limit ? Number(query.limit) : 50;

    return this.callsService.findAll({
      owner_id: ownerId,
      agent_id: agentId,
      status: query.status,
      limit,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Body() dto: SubmitCallDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CallResponseDto> {
    return this.callsService.submit(dto, user.id);
  }

  @Get('next')
  async getNext(@Query() query: GetNextOwnerQueryDto): Promise<CallResponseDto | null> {
    return this.callsService.getNextOwner(Number(query.project_id));
  }

  @Post('calling')
  @HttpCode(HttpStatus.OK)
  async notifyCalling(@Body() dto: NotifyCallingDto): Promise<void> {
    await this.callsService.notifyCalling(dto);
  }

  @Get(':callId')
  async findOne(@Param('callId', ParseIntPipe) callId: number): Promise<CallResponseDto | null> {
    return this.callsService.findById(callId);
  }
}
