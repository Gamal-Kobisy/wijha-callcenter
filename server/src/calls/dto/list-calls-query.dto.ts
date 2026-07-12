import { IsOptional, IsString, IsNumberString, IsDateString } from 'class-validator';

export class ListCallsQueryDto {
  @IsOptional()
  @IsNumberString()
  owner_id?: string;

  @IsOptional()
  @IsNumberString()
  agent_id?: string;

  @IsOptional()
  @IsNumberString()
  project_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  from?: Date;

  @IsOptional()
  @IsDateString()
  to?: Date;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
